// Shared types for BillHawk AI
// This is the exact shape returned by the OpenAI API and expected by the UI

export interface BillAnalysis {
  provider_name: string
  current_plan_name: string
  current_monthly_cost: number
  currency_code: string  // Add this (e.g., "TND", "EUR", "GBP")
  current_monthly_cost_usd: number  // Add this (converted to USD)
  due_date_or_contract_end: string
  estimated_savings_potential: string
  negotiation_script: string
}

// API response wrapper
export interface AnalyzeResponse {
  success: true
  data: BillAnalysis
}

export interface AnalyzeError {
  success: false
  error: string
}

export type AnalyzeResult = AnalyzeResponse | AnalyzeError
