"use client"

import { useState } from "react"
import BillDropzone from "@/components/BillDropzone"
import AnalysisResult from "@/components/AnalysisResult"
import type { BillAnalysis } from "@/lib/types"

export default function Home() {
  const [analysis, setAnalysis] = useState<BillAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleReset = () => {
    setAnalysis(null)
    setIsAnalyzing(false)
  }

  return (
    <div className="min-h-screen hero-gradient">
      {/* ── Navigation bar ───────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          {/* Hawk eye logo mark */}
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="shrink-0">
            <circle cx="16" cy="16" r="15" stroke="#F5A623" strokeWidth="1.5" fill="none" />
            <circle cx="16" cy="16" r="6" fill="#F5A623" opacity="0.9" />
            <circle cx="16" cy="16" r="2.5" fill="#0B1F3A" />
            {/* sweep lines */}
            <line x1="16" y1="1" x2="16" y2="7" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="16" y1="25" x2="16" y2="31" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="1" y1="16" x2="7" y2="16" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="25" y1="16" x2="31" y2="16" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-hawk-mist font-semibold text-lg tracking-tight">
            Bill<span className="text-hawk-amber">Hawk</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-hawk-fog text-sm hidden sm:block">
            🔒 Zero PII stored
          </span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-hawk-fog hover:text-hawk-mist text-sm transition-colors"
          >
            GitHub ↗
          </a>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      {!analysis && !isAnalyzing && (
        <section className="max-w-4xl mx-auto px-6 pt-14 pb-10 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-hawk-slate bg-hawk-steel/50 text-hawk-fog text-xs mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-hawk-mint animate-pulse-slow" />
            Powered by GPT-4o Vision — No data ever stored
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-hawk-mist leading-tight mb-5">
            Stop overpaying.<br />
            <span className="stat-number text-hawk-amber italic">Start negotiating.</span>
          </h1>

          <p className="text-hawk-fog text-lg max-w-xl mx-auto mb-3 leading-relaxed">
            Upload any bill — internet, phone, software, utilities.
            BillHawk redacts your personal info and hands you a word-for-word
            negotiation script to cut your costs.
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-12 text-hawk-fog text-sm">
            {[
              { icon: "🛡️", text: "PII never extracted" },
              { icon: "⚡", text: "Results in ~10 seconds" },
              { icon: "📋", text: "Copy-ready script" },
            ].map((b) => (
              <span key={b.text} className="flex items-center gap-1.5">
                {b.icon} {b.text}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Main content area ────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-6 pb-24">
        {!analysis ? (
          <BillDropzone
            onAnalysisStart={() => setIsAnalyzing(true)}
            onAnalysisComplete={(data) => {
              setAnalysis(data)
              setIsAnalyzing(false)
            }}
            onError={() => setIsAnalyzing(false)}
            isAnalyzing={isAnalyzing}
          />
        ) : (
          <AnalysisResult analysis={analysis} onReset={handleReset} />
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="text-center pb-8 text-hawk-fog text-xs">
        BillHawk AI · Privacy-first · No account required ·{" "}
        <a href="#" className="underline hover:text-hawk-mist transition-colors">
          How it works
        </a>
      </footer>
    </div>
  )
}
