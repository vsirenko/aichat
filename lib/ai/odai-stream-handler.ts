import type {
  BudgetConfirmationRequiredEvent,
  CostEstimateEvent,
  ModelActiveEvent,
  ModelCompleteEvent,
  ODAIStreamAnnotation,
  PhaseCompleteEvent,
  PhaseProgressEvent,
  PhaseStartEvent,
  WebSearchEvent,
} from "./odai-types";

export function isODAIAnnotation(
  annotation: unknown
): annotation is ODAIStreamAnnotation {
  if (!annotation || typeof annotation !== "object") return false;
  const ann = annotation as { type?: string };
  return typeof ann.type === "string" && ann.type.startsWith("odai-");
}

export function isPhaseStartEvent(
  annotation: ODAIStreamAnnotation
): annotation is { type: "odai-phase.start"; data: PhaseStartEvent } {
  return annotation.type === "odai-phase.start";
}

export function isPhaseProgressEvent(
  annotation: ODAIStreamAnnotation
): annotation is { type: "odai-phase.progress"; data: PhaseProgressEvent } {
  return annotation.type === "odai-phase.progress";
}

export function isPhaseCompleteEvent(
  annotation: ODAIStreamAnnotation
): annotation is { type: "odai-phase.complete"; data: PhaseCompleteEvent } {
  return annotation.type === "odai-phase.complete";
}

export function isModelActiveEvent(
  annotation: ODAIStreamAnnotation
): annotation is { type: "odai-model.active"; data: ModelActiveEvent } {
  return annotation.type === "odai-model.active";
}

export function isModelCompleteEvent(
  annotation: ODAIStreamAnnotation
): annotation is { type: "odai-model.complete"; data: ModelCompleteEvent } {
  return annotation.type === "odai-model.complete";
}

export function isWebSearchEvent(
  annotation: ODAIStreamAnnotation
): annotation is 
  | { type: "odai-web.search.phase1"; data: WebSearchEvent }
  | { type: "odai-web.search.phase4"; data: WebSearchEvent } {
  return (
    annotation.type === "odai-web.search.phase1" ||
    annotation.type === "odai-web.search.phase4"
  );
}

export function isCostEstimateEvent(
  annotation: ODAIStreamAnnotation
): annotation is { type: "odai-cost.estimate"; data: CostEstimateEvent } {
  return annotation.type === "odai-cost.estimate";
}

export function isBudgetConfirmationEvent(
  annotation: ODAIStreamAnnotation
): annotation is {
  type: "odai-budget.confirmation_required";
  data: BudgetConfirmationRequiredEvent;
} {
  return annotation.type === "odai-budget.confirmation_required";
}

export interface PhaseState {
  phase: string;
  phase_number: number;
  phase_name: string;
  status: "pending" | "running" | "completed" | "failed";
  duration_ms?: number;
  details?: Record<string, unknown>;
}

export interface ModelExecutionState {
  model_id: string;
  provider: string;
  sample_index: number;
  status: "pending" | "running" | "completed" | "failed";
  tokens_used?: number;
  thinking_tokens?: number;
  duration_ms?: number;
}

export function initializePhases(): PhaseState[] {
  return [
    {
      phase: "safety",
      phase_number: 0,
      phase_name: "Safety Check",
      status: "pending",
    },
    {
      phase: "pre_analysis",
      phase_number: 1,
      phase_name: "Parallel Pre-Analysis",
      status: "pending",
    },
    {
      phase: "budget_allocation",
      phase_number: 2,
      phase_name: "Compute Allocation",
      status: "pending",
    },
    {
      phase: "prompt_engineering",
      phase_number: 3,
      phase_name: "Prompt Engineering",
      status: "pending",
    },
    {
      phase: "inference",
      phase_number: 4,
      phase_name: "Parallel Inference",
      status: "pending",
    },
    {
      phase: "selection",
      phase_number: 5,
      phase_name: "Sample Selection",
      status: "pending",
    },
  ];
}

export function updatePhaseState(
  phases: PhaseState[],
  annotation: ODAIStreamAnnotation
): PhaseState[] {
  if (isPhaseStartEvent(annotation)) {
    return phases.map((p) =>
      p.phase === annotation.data.phase
        ? { ...p, status: "running" as const }
        : p
    );
  }

  if (isPhaseCompleteEvent(annotation)) {
    return phases.map((p) =>
      p.phase === annotation.data.phase
        ? {
            ...p,
            status: annotation.data.success
              ? ("completed" as const)
              : ("failed" as const),
            duration_ms: annotation.data.duration_ms,
            details: annotation.data.summary,
          }
        : p
    );
  }

  return phases;
}

export function updateModelState(
  models: ModelExecutionState[],
  annotation: ODAIStreamAnnotation
): ModelExecutionState[] {
  if (isModelActiveEvent(annotation)) {
    return [
      ...models,
      {
        model_id: annotation.data.model_id,
        provider: annotation.data.provider,
        sample_index: annotation.data.sample_index,
        status: "running" as const,
      },
    ];
  }

  if (isModelCompleteEvent(annotation)) {
    return models.map((m) =>
      m.model_id === annotation.data.model_id &&
      m.sample_index === annotation.data.sample_index
        ? {
            ...m,
            status:
              annotation.data.status === "success"
                ? ("completed" as const)
                : ("failed" as const),
            tokens_used: annotation.data.tokens_used,
            thinking_tokens: annotation.data.thinking_tokens,
            duration_ms: annotation.data.duration_ms,
          }
        : m
    );
  }

  return models;
}

export function formatModelName(modelId: string): string {
  return modelId
    .replace(/-\d{8}$/, "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getComplexityColor(
  tier: "low" | "medium" | "high" | "extreme"
): string {
  const colors = {
    low: "#22c55e",
    medium: "#eab308",
    high: "#f97316",
    extreme: "#ef4444",
  };
  return colors[tier];
}

export function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    anthropic: "#d4a27f",
    openai: "#00a67e",
    google: "#4285f4",
    groq: "#f55036",
    together: "#6366f1",
  };
  return colors[provider] || "#6b7280";
}
