// Shared types for BillHawk AI
// This is the exact shape returned by the OpenAI API and expected by the UI

export interface BillAnalysis {
  provider_name: string
  current_plan_name: string
  current_monthly_cost: number
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
