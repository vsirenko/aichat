import type { PhaseState } from "@/lib/types";

export interface SafetySummary extends Record<string, unknown> {
  decision: "allowed" | "block";
  confidence?: number;
  duration_ms?: number;
  rationale?: string;
  violation_category?: string;
}

export interface PreAnalysisSummary extends Record<string, unknown> {
  complexity?: {
    score: number;
    tier: "low" | "medium" | "high" | "extreme";
    rationale?: string;
    is_decomposable?: boolean;
    decomposition_count?: number;
  };
  domain?: {
    primary: string;
    secondary?: string[];
    confidence?: number;
    subdomain_hints?: string[];
    programming_languages?: string[];
  };
  extraction?: {
    urls?: number;
    code_blocks?: number;
    error_messages?: number;
    structured_data?: number;
  };
  web_search?: {
    required: boolean;
    categories?: string[];
    priority?: string;
    sources_found?: number;
  };
  duration_ms?: number;
}

export interface BudgetSummary extends Record<string, unknown> {
  execution_mode?: string;
  budget?: {
    reasoning_budget: number;
    sample_count: number;
    sampling_strategy?: string;
    estimated_cost_usd: number;
  };
  model_roster?: Array<{
    model_id: string;
    provider: string;
    role: string;
    allocation_percentage: number;
    sample_count: number;
  }>;
  total_models?: number;
  primary_model?: string;
  decomposition?: {
    should_decompose: boolean;
    sub_task_count?: number;
    execution_waves?: number;
    aggregation_strategy?: string;
  };
  duration_ms?: number;
}

export interface PromptsSummary extends Record<string, unknown> {
  execution_mode?: string;
  prompts_generated: number;
  llm_enhancement?: {
    applied: boolean;
    model?: string | null;
  };
  tokens?: {
    total_prompt: number;
    context_injected: number;
    context_truncated: boolean;
  };
  construction_strategy?: string;
  duration_ms?: number;
}

export interface InferenceSummary extends Record<string, unknown> {
  execution_mode?: string;
  llm_calls?: {
    total: number;
    successful: number;
    failed: number;
  };
  models_used?: string[];
  providers_used?: string[];
  tokens?: {
    total: number;
    thinking: number;
  };
  multi_sampling_applied?: boolean;
  primary_model?: string;
  duration_ms?: number;
}

export interface SelectionSummary extends Record<string, unknown> {
  samples_ranked: number;
  llm_judge_calls?: number;
  outliers_detected?: number;
  winner?: {
    model: string;
    provider: string;
    ranking_score: number;
    selection_confidence: number;
    score_breakdown?: Record<string, unknown> | null;
  };
  aggregation?: {
    performed: boolean;
    model?: string;
    duration_ms?: number;
  };
  timing?: {
    ranking_duration_ms: number;
    selection_duration_ms: number;
    total_duration_ms: number;
  };
}

export function isSafetySummary(
  details: Record<string, unknown> | undefined
): details is SafetySummary {
  return details !== undefined && "decision" in details;
}

export function isPreAnalysisSummary(
  details: Record<string, unknown> | undefined
): details is PreAnalysisSummary {
  return details !== undefined && "complexity" in details;
}

export function isBudgetSummary(
  details: Record<string, unknown> | undefined
): details is BudgetSummary {
  return details !== undefined && "budget" in details;
}

export function isPromptsSummary(
  details: Record<string, unknown> | undefined
): details is PromptsSummary {
  return details !== undefined && "prompts_generated" in details;
}

export function isInferenceSummary(
  details: Record<string, unknown> | undefined
): details is InferenceSummary {
  return details !== undefined && "llm_calls" in details;
}

export function isSelectionSummary(
  details: Record<string, unknown> | undefined
): details is SelectionSummary {
  return details !== undefined && "samples_ranked" in details;
}

export function formatDuration(durationMs: number | undefined): string {
  if (durationMs === undefined) return "N/A";
  return `${(durationMs / 1000).toFixed(2)}s`;
}

export function isPhaseCompleted(phase: PhaseState): boolean {
  return phase.status === "completed" && phase.details !== undefined;
}

export function isPhaseClickable(phase: PhaseState): boolean {
  return isPhaseCompleted(phase) || phase.status === "failed";
}

