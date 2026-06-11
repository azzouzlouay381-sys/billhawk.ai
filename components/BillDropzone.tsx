"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useDropzone } from "react-dropzone"
import type { FileRejection } from "react-dropzone"
import { toast } from "sonner"
import type { BillAnalysis } from "@/lib/types"

// ─── Constants ────────────────────────────────────────────────────────────────
const ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/heic": [".heic"],
  "application/pdf": [".pdf"],
}
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onAnalysisStart: () => void
  onAnalysisComplete: (data: BillAnalysis) => void
  onError: () => void
  isAnalyzing: boolean
}

export default function BillDropzone({
  onAnalysisStart,
  onAnalysisComplete,
  onError,
  isAnalyzing,
}: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileType, setFileType] = useState<string | null>(null)

  // ── File → base64 helper ──────────────────────────────────────────────────
  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsDataURL(file)
    })

  // ── Analyze via API route ─────────────────────────────────────────────────
  const analyzeFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_SIZE_BYTES) {
        toast.error("File too large. Max 10 MB.")
        return
      }

      onAnalysisStart()

      try {
        const base64DataUrl = await toBase64(file)

        const res = await fetch("/api/analyze-bill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dataUrl: base64DataUrl,
            mimeType: file.type,
            fileName: file.name,
          }),
        })

        const json = await res.json()

        if (!res.ok || !json.success) {
          throw new Error(json.error ?? "Analysis failed. Please try again.")
        }

        onAnalysisComplete(json.data)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unexpected error"
        toast.error(message)
        onError()
      }
    },
    [onAnalysisStart, onAnalysisComplete, onError]
  )

  // ── Process accepted file ─────────────────────────────────────────────────
  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name)
      setFileType(file.type)

      // Generate a preview URL for images (not for PDFs)
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file)
        setPreview(url)
      } else {
        setPreview(null) // PDF — no image preview
      }

      analyzeFile(file)
    },
    [analyzeFile]
  )

  // ── react-dropzone setup ──────────────────────────────────────────────────
  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      if (rejected.length > 0) {
        const code = rejected[0]?.errors?.[0]?.code
        if (code === "file-too-large") toast.error("File too large. Max 10 MB.")
        else toast.error("Unsupported file type. Use JPG, PNG, HEIC, or PDF.")
        return
      }
      if (accepted[0]) handleFile(accepted[0])
    },
    [handleFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: MAX_SIZE_BYTES,
    disabled: isAnalyzing,
  })

  // ── Clipboard paste listener (Ctrl+V / Cmd+V) ────────────────────────────
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isAnalyzing) return
      const items = Array.from(e.clipboardData?.items ?? [])
      const imageItem = items.find((item) => item.type.startsWith("image/"))
      if (imageItem) {
        e.preventDefault()
        const file = imageItem.getAsFile()
        if (file) {
          // Give it a meaningful name for display
          const ext = imageItem.type.split("/")[1] ?? "png"
          const named = new File([file], `pasted-bill.${ext}`, {
            type: imageItem.type,
          })
          handleFile(named)
        }
      }
    }
    window.addEventListener("paste", handlePaste)
    return () => window.removeEventListener("paste", handlePaste)
  }, [isAnalyzing, handleFile])

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isAnalyzing) {
    return (
      <div className="w-full rounded-3xl border border-hawk-slate bg-hawk-steel/60 p-10 text-center animate-fade-in">
        {/* Preview thumbnail during analysis */}
        {preview && (
          <div className="mb-6 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Your bill preview"
              className="max-h-40 rounded-xl object-contain opacity-60 ring-1 ring-hawk-slate"
            />
          </div>
        )}

        {/* Spinner */}
        <div className="flex justify-center mb-6">
          <svg
            className="w-12 h-12 animate-spin text-hawk-amber"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>

        {/* Progress steps */}
        <AnalyzingSteps />

        <p className="text-hawk-fog text-sm mt-4">
          🔒 Anonymizing data and analyzing plan details…
        </p>
        {fileName && (
          <p className="text-hawk-fog/60 text-xs mt-2 truncate">{fileName}</p>
        )}
      </div>
    )
  }

  // ── Dropzone UI ───────────────────────────────────────────────────────────
  return (
    <div
      {...getRootProps()}
      className={[
        "relative w-full rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-300",
        "bg-hawk-steel/40 hover:bg-hawk-steel/60",
        "p-12 text-center select-none",
        isDragActive
          ? "border-hawk-amber bg-hawk-steel/70 shadow-glow-amber dropzone-ring-pulse"
          : "border-hawk-slate hover:border-hawk-sky",
      ].join(" ")}
    >
      <input {...getInputProps()} />

      {/* Upload icon */}
      <div className="flex justify-center mb-5">
        <div
          className={[
            "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-300",
            isDragActive ? "bg-hawk-amber/20" : "bg-hawk-slate/60",
          ].join(" ")}
        >
          <svg
            className={[
              "w-8 h-8 transition-colors duration-300",
              isDragActive ? "text-hawk-amber" : "text-hawk-sky",
            ].join(" ")}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>
      </div>

      {isDragActive ? (
        <p className="text-hawk-amber text-lg font-semibold">
          Release to analyze bill →
        </p>
      ) : (
        <>
          <p className="text-hawk-mist text-lg font-semibold mb-2">
            Drop your bill here
          </p>
          <p className="text-hawk-fog text-sm leading-relaxed">
            Drag &amp; drop, click to browse, or paste a screenshot
            <br />
            <kbd className="px-1.5 py-0.5 rounded bg-hawk-slate text-hawk-fog text-xs font-mono mx-1">
              Ctrl+V
            </kbd>
            /
            <kbd className="px-1.5 py-0.5 rounded bg-hawk-slate text-hawk-fog text-xs font-mono mx-1">
              Cmd+V
            </kbd>
          </p>

          {/* Accepted formats */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {["JPG", "PNG", "HEIC", "PDF"].map((fmt) => (
              <span
                key={fmt}
                className="px-2.5 py-1 rounded-lg bg-hawk-navy border border-hawk-slate text-hawk-fog text-xs font-mono"
              >
                .{fmt.toLowerCase()}
              </span>
            ))}
            <span className="px-2.5 py-1 rounded-lg bg-hawk-navy border border-hawk-slate text-hawk-fog text-xs">
              up to 10 MB
            </span>
          </div>
        </>
      )}

      {/* Bottom privacy note */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-hawk-fog/50 text-xs">
          🔒 File processed in-memory · Never stored
        </span>
      </div>
    </div>
  )
}

// ─── Animated step list shown while analyzing ─────────────────────────────────
function AnalyzingSteps() {
  const steps = [
    "Reading bill structure…",
    "Redacting personal info…",
    "Identifying pricing plan…",
    "Calculating savings opportunities…",
    "Writing negotiation script…",
  ]
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => Math.min(prev + 1, steps.length - 1))
    }, 1600)
    return () => clearInterval(id)
  }, [steps.length])

  return (
    <ul className="space-y-2 text-sm max-w-xs mx-auto">
      {steps.map((step, i) => (
        <li
          key={step}
          className={[
            "flex items-center gap-2 transition-all duration-500",
            i < active
              ? "text-hawk-mint"
              : i === active
              ? "text-hawk-mist"
              : "text-hawk-fog/30",
          ].join(" ")}
        >
          <span className="shrink-0 w-4 h-4">
            {i < active ? (
              // Checkmark
              <svg viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="#34C77B" opacity="0.2" />
                <path
                  d="M5 8.5l2 2 4-4"
                  stroke="#34C77B"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : i === active ? (
              // Spinner dot
              <svg
                viewBox="0 0 16 16"
                className="animate-spin"
                fill="none"
              >
                <circle
                  cx="8"
                  cy="8"
                  r="6"
                  stroke="#F5A623"
                  strokeWidth="2"
                  strokeDasharray="20 16"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3" fill="#2E4D6B" />
              </svg>
            )}
          </span>
          {step}
        </li>
      ))}
    </ul>
  )
}
