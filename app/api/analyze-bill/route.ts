import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import type { BillAnalysis } from "@/lib/types"

// ✅ SECURE: Pulls the key from your .env.local file instead of hardcoding it
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
})

const SYSTEM_PROMPT = `You are an expert financial auditor and negotiation assistant. Analyze the provided image of a bill or invoice.

Your task is to extract ONLY the following information into a strict JSON format:
- provider_name (string — e.g., "Comcast", "AT&T", "Adobe")
- current_plan_name (string — e.g., "Gigabit Pro", "Creative Cloud All Apps")
- current_monthly_cost (number only — e.g., 89.99)
- due_date_or_contract_end (string — e.g., "2024-08-15" or "December 2024" or "N/A")
- estimated_savings_potential (string — e.g., "Switch to annual plan to save ~$30/mo" or "Ask for loyalty retention discount; typical 20-30% off")
- negotiation_script (string — a polite but firm 2-3 sentence script the user can copy/paste into a live chat or email to get a lower rate)

CRITICAL PRIVACY RULE: Do NOT extract, mention, repeat, or include any Personally Identifiable Information (PII) such as: full names, home addresses, street addresses, phone numbers, account numbers, social security numbers, email addresses, IP addresses, or any other personal identifiers. If you see them on the bill, ignore them completely.

CRITICAL FORMAT RULE: Output ONLY valid JSON. No markdown fences, no preamble. If the image is not a bill, return: {"error": "Not a recognizable bill or invoice."}`

export async function POST(req: NextRequest) {
  try {
    // 1. Parse body
    let body: { dataUrl?: string; mimeType?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400 }
      )
    }

    const { dataUrl, mimeType } = body

    if (!dataUrl || !mimeType) {
      return NextResponse.json(
        { success: false, error: "Missing dataUrl or mimeType." },
        { status: 400 }
      )
    }

    // 2. Validate mime type
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/heic",
      "application/pdf",
    ]
    if (!allowed.includes(mimeType)) {
      return NextResponse.json(
        { success: false, error: `Unsupported file type: ${mimeType}` },
        { status: 415 }
      )
    }

    // 3. Build message — typed explicitly to satisfy OpenAI SDK strictness
    const userContent: OpenAI.Chat.ChatCompletionContentPart[] =
      mimeType === "application/pdf"
        ? [
            {
              type: "text",
              text: "This is a PDF bill. Analyze it and extract the billing details as instructed.",
            },
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
          ]
        : [
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
          ]

    // 4. Call Groq via OpenAI-compatible SDK
    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      max_tokens: 800,
      temperature: 0.1,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userContent },
      ],
    })

    const rawContent = completion.choices[0]?.message?.content ?? ""

    // 5. Parse JSON — strip any accidental markdown fences
    let parsed: Record<string, unknown>
    try {
      const cleaned = rawContent
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim()
      parsed = JSON.parse(cleaned)
    } catch {
      console.error("Non-JSON response from Groq:", rawContent)
      return NextResponse.json(
        { success: false, error: "AI returned unexpected format. Try a clearer image." },
        { status: 500 }
      )
    }

    // 6. Model-level error signal
    if (parsed.error) {
      return NextResponse.json(
        { success: false, error: parsed.error as string },
        { status: 422 }
      )
    }

    // 7. Validate all required fields are present
    const required: (keyof BillAnalysis)[] = [
      "provider_name",
      "current_plan_name",
      "current_monthly_cost",
      "due_date_or_contract_end",
      "estimated_savings_potential",
      "negotiation_script",
    ]
    const missing = required.filter((k) => parsed[k] == null)
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, error: `Incomplete result (missing: ${missing.join(", ")}). Try a clearer image.` },
        { status: 422 }
      )
    }

    // 8. Return typed, sanitised result
    const analysis: BillAnalysis = {
      provider_name:              String(parsed.provider_name),
      current_plan_name:          String(parsed.current_plan_name),
      current_monthly_cost:       Number(parsed.current_monthly_cost),
      due_date_or_contract_end:   String(parsed.due_date_or_contract_end),
      estimated_savings_potential: String(parsed.estimated_savings_potential),
      negotiation_script:         String(parsed.negotiation_script),
    }

    return NextResponse.json({ success: true, data: analysis })

  } catch (err: unknown) {
    if (err instanceof OpenAI.APIError) {
      if (err.status === 401) {
        // ✅ Updated error message to point to .env.local
        return NextResponse.json(
          { success: false, error: "Invalid API key. Make sure GROQ_API_KEY is set in your .env.local file." },
          { status: 500 }
        )
      }
      if (err.status === 429) {
        return NextResponse.json(
          { success: false, error: "Rate limit reached. Wait a moment and try again." },
          { status: 429 }
        )
      }
    }
    console.error("Unexpected error:", err)
    return NextResponse.json(
      { success: false, error: "Analysis failed. Please try again." },
      { status: 500 }
    )
  }
}