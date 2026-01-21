export type ODAIEventType =
  | "message.start"
  | "message.delta"
  | "message.complete"
  | "phase.start"
  | "phase.progress"
  | "phase.complete"
  | "model.active"
  | "model.complete"
  | "web.search"
  | "web.scrape"
  | "cost.estimate"
  | "budget.confirmation_required"
  | "budget.confirmation_response"
  | "error"
  | "done";

export type ODAIPhaseEventType =
  | "phase.start"
  | "phase.progress"
  | "phase.complete"
  | "model.active"
  | "model.complete"
  | "web.search"
  | "web.scrape"
  | "cost.estimate"
  | "budget.confirmation_required";

export interface AccessCodeRequest {
  access_code: string;
}

export interface SessionTokenResponse {
  session_token: string;
  token_type: "Bearer";
  expires_in: number;
  expires_at: string;
  quota: number;
  quota_remaining: number;
  scope: string;
  access_code_id: string;
}

export interface SessionStatusResponse {
  session_token: string;
  quota_remaining: number;
  quota_limit: number;
  expires_at: string;
  is_valid: boolean;
}

export interface TokenRevokeRequest {
  session_token: string;
}

export interface ODAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string;
}

export interface ChatCompletionRequest {
  model: "odai-frontier" | "odai-fast";
  messages: ODAIMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  user?: string;
  include_phase_events?: boolean;
  skip_safety_check?: boolean;
  skip_llm_enhancement?: boolean;
  skip_llm_judge?: boolean;
  max_samples_per_model?: number;
}

export interface PhaseStartEvent {
  phase: string;
  phase_number: number;
  phase_name: string;
  description?: string;
  timestamp: string;
}

export interface PhaseProgressEvent {
  phase: string;
  step: string;
  step_name: string;
  status: string;
  progress_percent?: number;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface PhaseMetrics {
  phase_id: string;
  phase_name: string;
  duration_ms: number;
  total_llm_calls: number;
  successful_llm_calls: number;
  failed_llm_calls: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_thinking_tokens: number;
  models_used: string[];
  providers_used: string[];
  total_tool_calls: number;
  queries_searched: number;
  sources_scraped: number;
  llm_cost_usd: number;
  tool_cost_usd: number;
  total_cost_usd: number;
}

export interface PhaseCompleteEvent {
  phase: string;
  phase_number: number;
  duration_ms: number;
  success: boolean;
  summary?: Record<string, unknown>;
  timestamp: string;
}

export interface ModelActiveEvent {
  phase: "inference";
  model_id: string;
  provider: string;
  role?: string;
  sample_index: number;
  total_samples?: number;
  wave_number?: number;
  temperature?: number;
  timestamp: string;
}

export interface ModelCompleteEvent {
  phase: "inference";
  model_id: string;
  provider: string;
  sample_index: number;
  status: "success" | "failed" | "timeout";
  tokens_used?: number;
  thinking_tokens?: number;
  duration_ms: number;
  error_message?: string;
  timestamp: string;
}

export interface WebSearchEvent {
  action: "executing" | "completed";
  categories?: string[];
  query_count?: number;
  results_found?: number;
  sources_count?: number;
  sources?: Array<{
    title: string;
    url: string;
  }>;
  result_urls?: string[];
  depth_exploration_used?: boolean;
  depth_exploration_result_urls?: string[];
  timestamp: string;
}

export interface WebScrapeEvent {
  action: "executing" | "completed";
  sources?: Array<{
    title: string;
    url: string;
  }>;
  urls_scraped?: string[];
  sub_links_scraped?: number;
  timestamp: string;
}

export interface CostEstimateEvent {
  estimated_cost_usd: number;
  estimated_tokens: number;
  complexity_tier: "low" | "medium" | "high" | "extreme" | "frontier";
  model_count: number;
  sample_count: number;
  reasoning_budget: number;
  requires_confirmation: boolean;
  timestamp: string;
}

export interface MessageStartEvent {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
}

export interface MessageDeltaEvent {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason: string | null;
  }>;
}

export interface MessageCompleteEvent {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: Record<string, never>;
    finish_reason: "stop";
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    reasoning_tokens?: number;
  };
  usage_usd?: {
    prompt_cost_usd: number;
    completion_cost_usd: number;
    reasoning_cost_usd: number;
    total_cost_usd: number;
  };
}

export interface ErrorEvent {
  type: "phase_error" | "fatal_error";
  phase?: string;
  code: string;
  message: string;
  recoverable: boolean;
  fallback_used?: boolean;
  timestamp: string;
}

export interface SSEEvent {
  type: ODAIEventType;
  data:
    | PhaseStartEvent
    | PhaseProgressEvent
    | PhaseCompleteEvent
    | ModelActiveEvent
    | ModelCompleteEvent
    | WebSearchEvent
    | WebScrapeEvent
    | CostEstimateEvent
    | MessageStartEvent
    | MessageDeltaEvent
    | MessageCompleteEvent
    | ErrorEvent
    | null;
}

export interface ODAIError {
  error: {
    type: string;
    message: string;
    param?: string;
    code?: string;
    details?: Record<string, unknown>;
  };
}

export type ODAIStreamAnnotation =
  | { type: "odai-phase.start"; data: PhaseStartEvent }
  | { type: "odai-phase.progress"; data: PhaseProgressEvent }
  | { type: "odai-phase.complete"; data: PhaseCompleteEvent }
  | { type: "odai-model.active"; data: ModelActiveEvent }
  | { type: "odai-model.complete"; data: ModelCompleteEvent }
  | { type: "odai-web.search"; data: WebSearchEvent }
  | { type: "odai-web.scrape"; data: WebScrapeEvent }
  | { type: "odai-cost.estimate"; data: CostEstimateEvent }
  | {
      type: "odai-budget.confirmation_required";
      data: BudgetConfirmationRequiredEvent;
    }
  | { type: "odai-error"; data: ErrorEvent };

export interface BudgetConfirmationRequiredEvent {
  estimated_cost_usd: number;
  threshold_usd: number;
  timeout_seconds: number;
  confirmation_id: string;
  options: BudgetOption[];
  message: string;
  timestamp: string;
}

export interface BudgetOption {
  action: "continue" | "reduce" | "abort";
  label: string;
  description: string;
  new_budget_percentage?: number;
  new_estimated_cost_usd?: number;
}

export interface WebContextRefreshDetails {
  prompts_refreshed: number;
  prompts_failed: number;
  prompts_skipped: number;
  total_sources_found: number;
  total_urls_scraped: number;
  refresh_time_ms: number;
}
