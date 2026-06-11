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
- provider_name (string — the company name on the bill)
- current_plan_name (string — the service/plan name)
- current_monthly_cost (number only — the exact amount shown on the bill)
- currency_code (string — 3-letter ISO code: detect from bill. Examples: "TND", "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR", "AED", "SAR", "EGP", "MAD", "DZD", "LYD", "XOF", "XAF", "KES", "NGN", "ZAR", etc.)
- current_monthly_cost_usd (number — convert to USD using approximate exchange rates. Use these rough rates:
   • TND (Tunisian Dinar): divide by 3.1
   • EUR (Euro): multiply by 1.08
   • GBP (British Pound): multiply by 1.27
   • CAD (Canadian Dollar): multiply by 0.74
   • AUD (Australian Dollar): multiply by 0.66
   • JPY (Japanese Yen): divide by 150
   • INR (Indian Rupee): divide by 83
   • AED (UAE Dirham): divide by 3.67
   • SAR (Saudi Riyal): divide by 3.75
   • EGP (Egyptian Pound): divide by 47
   • MAD (Moroccan Dirham): divide by 10
   • DZD (Algerian Dinar): divide by 135
   • LYD (Libyan Dinar): divide by 4.8
   • XOF/XAF (CFA Franc): divide by 610
   • KES (Kenyan Shilling): divide by 130
   • NGN (Nigerian Naira): divide by 1500
   • ZAR (South African Rand): divide by 18
   • If currency not listed: estimate based on known rates or use 1.0 if unknown)
- due_date_or_contract_end (string — e.g., "2024-08-15" or "December 2024" or "N/A")
- estimated_savings_potential (string — provide region-specific advice:
   • For Tunisia (TND): "Ask for loyalty discount, check competitors like Orange/Ooredoo, typical 10-20% savings"
   • For Middle East (AED/SAR/EGP): "Compare with other providers, ask for promotional rates, typical 15-25% savings"
   • For Europe (EUR/GBP): "Check competitor offers, ask for retention deals, typical 20-30% savings"
   • For North America (USD/CAD): "Switch to annual plan or negotiate, typical 20-30% savings"
   • For Africa (XOF/XAF/KES/NGN/ZAR): "Research competitor pricing, ask for price match, typical 10-20% savings"
   • For Asia (JPY/INR): "Check promotional offers, negotiate long-term contract, typical 15-25% savings"
   • If unclear: "Research local competitor pricing and ask for price match or loyalty discount")
- negotiation_script (string — a polite but firm 2-3 sentence script the user can copy/paste. Make it culturally appropriate and mention checking competitor offers)

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