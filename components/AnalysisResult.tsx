"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { BillAnalysis } from "@/lib/types"

interface Props {
  analysis: BillAnalysis
  onReset: () => void
}

export default function AnalysisResult({ analysis, onReset }: Props) {
  const [copied, setCopied] = useState(false)

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(analysis.negotiation_script)
      setCopied(true)
      toast.success("Copied to clipboard! Paste it into live chat or email.", {
        duration: 3000,
      })
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error("Clipboard access denied. Please copy manually.")
    }
  }

  return (
    <div className="animate-slide-up space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-hawk-fog text-sm mb-0.5">Analysis complete</p>
          <h2 className="text-hawk-mist text-2xl font-bold">
            {analysis.provider_name}
          </h2>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-hawk-slate text-hawk-fog text-sm hover:border-hawk-sky hover:text-hawk-mist transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m0 14v1M4.22 4.22l.71.71m14.14 14.14l.71.71M1 12h1m20 0h1M4.22 19.78l.71-.71M19.07 4.93l.71-.71" />
          </svg>
          Analyze another
        </button>
      </div>

      {/* ── Top stats row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Current cost — highlighted red */}
        <StatCard
          label="Monthly cost"
          value={`$${analysis.current_monthly_cost.toFixed(2)}`}
          sub={analysis.current_plan_name}
          variant="danger"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2M12 2a10 10 0 100 20A10 10 0 0012 2z" />
            </svg>
          }
        />

        {/* Due date */}
        <StatCard
          label="Due / Contract ends"
          value={analysis.due_date_or_contract_end || "Not found"}
          sub="Review before this date"
          variant="neutral"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* ── Savings potential card ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-hawk-mint/30 bg-hawk-mint/5 p-5 shadow-glow-mint">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-8 h-8 rounded-xl bg-hawk-mint/15 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-hawk-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p className="text-hawk-fog text-xs uppercase tracking-widest mb-1 font-medium">
              Savings potential
            </p>
            <p className="text-hawk-mint font-semibold text-base leading-snug">
              {analysis.estimated_savings_potential}
            </p>
          </div>
        </div>
      </div>

      {/* ── Negotiation script card ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-hawk-slate bg-hawk-steel/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-hawk-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z" />
            </svg>
            <span className="text-hawk-fog text-xs uppercase tracking-widest font-medium">
              Your negotiation script
            </span>
          </div>

          {/* Copy button */}
          <button
            onClick={copyScript}
            className={[
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
              copied
                ? "bg-hawk-mint/20 border border-hawk-mint text-hawk-mint"
                : "bg-hawk-amber/10 border border-hawk-amber/40 text-hawk-amber hover:bg-hawk-amber hover:text-hawk-navy",
            ].join(" ")}
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy script
              </>
            )}
          </button>
        </div>

        {/* Script text */}
        <blockquote className="script-prose border-l-2 border-hawk-amber/40 pl-4">
          {analysis.negotiation_script}
        </blockquote>
      </div>

      {/* ── Privacy note ─────────────────────────────────────────────────── */}
      <p className="text-center text-hawk-fog/50 text-xs pt-2">
        🔒 No personal info was extracted · Analysis ran in-memory · Nothing stored
      </p>
    </div>
  )
}

// ─── Reusable stat card ───────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  variant,
  icon,
}: {
  label: string
  value: string
  sub: string
  variant: "danger" | "neutral"
  icon: React.ReactNode
}) {
  const valueColor =
    variant === "danger" ? "text-hawk-rose" : "text-hawk-mist"
  const iconBg =
    variant === "danger" ? "bg-hawk-rose/15 text-hawk-rose" : "bg-hawk-slate text-hawk-sky"

  return (
    <div className="rounded-2xl border border-hawk-slate bg-hawk-steel/50 p-5 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <span className="text-hawk-fog text-xs uppercase tracking-widest font-medium">
          {label}
        </span>
      </div>
      <p className={`stat-number text-3xl font-semibold ${valueColor} leading-none mb-1`}>
        {value}
      </p>
      <p className="text-hawk-fog text-xs truncate">{sub}</p>
    </div>
  )
}
