"use client";

import type {
  ModelExecutionState,
  PhaseState,
} from "@/lib/ai/odai-stream-handler";
import {
  formatModelName,
  getComplexityColor,
  getProviderColor,
} from "@/lib/ai/odai-stream-handler";
import { formatCost, formatDuration } from "@/lib/formatters";

interface ODAIPhaseTrackerProps {
  phases: PhaseState[];
  models: ModelExecutionState[];
  costEstimate?: number;
  webSources?: Array<{ title: string; url: string }>;
}

export function ODAIPhaseTracker({
  phases,
  models,
  costEstimate,
  webSources,
}: ODAIPhaseTrackerProps) {
  const hasActivePhases = phases.some((p) => p.status !== "pending");

  if (!hasActivePhases) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-background p-4">
      <h3 className="font-semibold text-sm">ODAI Reasoning Pipeline</h3>

      {}
      <div className="flex gap-2">
        {phases.map((phase) => (
          <PhaseIndicator key={phase.phase} phase={phase} />
        ))}
      </div>

      {}
      {costEstimate !== undefined && (
        <div className="text-muted-foreground text-xs">
          Estimated cost:{" "}
          <span className="font-mono">{formatCost(costEstimate)}</span>
        </div>
      )}

      {}
      {webSources && webSources.length > 0 && (
        <div className="space-y-2">
          <div className="font-medium text-xs">
            Web Sources ({webSources.length})
          </div>
          <div className="space-y-1">
            {webSources.slice(0, 3).map((source, i) => (
              <a
                className="block truncate text-blue-600 text-xs hover:underline"
                href={source.url}
                key={i}
                rel="noopener noreferrer"
                target="_blank"
              >
                {source.title}
              </a>
            ))}
            {webSources.length > 3 && (
              <div className="text-muted-foreground text-xs">
                +{webSources.length - 3} more sources
              </div>
            )}
          </div>
        </div>
      )}

      {}
      {models.length > 0 && (
        <div className="space-y-2">
          <div className="font-medium text-xs">Phase 4: Parallel Inference</div>
          <div className="space-y-1">
            {models.map((model, i) => (
              <ModelExecutionRow key={`${model.model_id}-${i}`} model={model} />
            ))}
          </div>
        </div>
      )}

      {}
      {phases
        .filter((p) => p.status === "completed" && p.details)
        .map((phase) => (
          <PhaseDetails key={phase.phase} phase={phase} />
        ))}
    </div>
  );
}

function PhaseIndicator({ phase }: { phase: PhaseState }) {
  const statusColors = {
    pending: "bg-gray-200 dark:bg-gray-700",
    running: "bg-blue-500 animate-pulse",
    completed: "bg-green-500",
    failed: "bg-red-500",
  };

  const statusIcons = {
    pending: "○",
    running: "●",
    completed: "✓",
    failed: "✗",
  };

  return (
    <div
      className="flex flex-1 flex-col items-center gap-1"
      title={phase.phase_name}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-white text-xs ${statusColors[phase.status]}`}
      >
        {statusIcons[phase.status]}
      </div>
      <div className="text-center text-[10px] text-muted-foreground">
        P{phase.phase_number}
      </div>
      {phase.duration_ms && (
        <div className="text-[9px] text-muted-foreground">
          {formatDuration(phase.duration_ms)}
        </div>
      )}
    </div>
  );
}

function ModelExecutionRow({ model }: { model: ModelExecutionState }) {
  const statusIcons = {
    pending: "○",
    running: "●",
    completed: "✓",
    failed: "✗",
  };

  const statusColors = {
    pending: "text-gray-400",
    running: "text-blue-500",
    completed: "text-green-500",
    failed: "text-red-500",
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={statusColors[model.status]}>
        {statusIcons[model.status]}
      </span>
      <span
        className="font-mono"
        style={{ color: getProviderColor(model.provider) }}
      >
        {formatModelName(model.model_id)}
      </span>
      {model.tokens_used && (
        <span className="text-muted-foreground">
          {model.tokens_used.toLocaleString()} tokens
        </span>
      )}
      {model.duration_ms && (
        <span className="text-muted-foreground">
          {formatDuration(model.duration_ms)}
        </span>
      )}
    </div>
  );
}

function PhaseDetails({ phase }: { phase: PhaseState }) {
  if (!phase.details) return null;

  return (
    <div className="space-y-2 rounded border border-border p-3">
      <div className="font-semibold text-xs">{phase.phase_name} Results</div>
      <div className="space-y-1">
        {Object.entries(phase.details).map(([key, value]) => (
          <div className="flex gap-2 text-xs" key={key}>
            <span className="text-muted-foreground capitalize">
              {key.replace(/_/g, " ")}:
            </span>
            <span className="font-mono">
              {typeof value === "object"
                ? JSON.stringify(value)
                : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
