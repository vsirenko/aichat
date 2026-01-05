"use client";

import { CheckCircle2, ChevronDown, Circle, XCircle } from "lucide-react";
import { memo, useState } from "react";
import type { PhaseState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ModelExecutionTable } from "./model-execution-table";
import { useODAIContext } from "./odai-context";
import { ResponsiveSheet } from "./ui/responsive-sheet";
import { WaveProgressDisplay } from "./wave-progress-display";
import { WebRefreshDisplay } from "./web-refresh-display";
import { WebSourcesPanel } from "./web-sources-panel";

interface PhaseIndicatorProps {
  phase: PhaseState;
  onClick?: () => void;
  isExpanded?: boolean;
}

function PhaseIndicator({ phase, onClick, isExpanded }: PhaseIndicatorProps) {
  const StatusIcon = {
    pending: Circle,
    running: Circle,
    completed: CheckCircle2,
    failed: XCircle,
  }[phase.status];

  const iconColors = {
    pending: "text-muted-foreground/40",
    running: "text-blue-600 dark:text-blue-400 animate-pulse",
    completed: "text-green-600 dark:text-green-500",
    failed: "text-red-600 dark:text-red-500",
  };

  const cardStyles = {
    pending: "border-border/40 bg-muted/10",
    running: "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg",
    completed: "border-green-500/50 bg-green-50/30 dark:bg-green-950/20",
    failed: "border-red-500/50 bg-red-50/30 dark:bg-red-950/20",
  };

  const isInferencePhase = phase.phase === "inference";
  const isPreAnalysisPhase = phase.phase === "pre_analysis";
  const hasDetails =
    (isInferencePhase &&
      (phase.status === "running" || phase.status === "completed")) ||
    (isPreAnalysisPhase &&
      (phase.status === "running" || phase.status === "completed"));

  const progress = phase.progress_percent ?? 0;
  const showProgress = phase.status === "running" && progress > 0;

  const tooltipText = [
    phase.phase_name,
    phase.duration_ms && ` - ${(phase.duration_ms / 1000).toFixed(1)}s`,
    showProgress && ` (${progress}%)`,
    phase.current_step_name && `\n${phase.current_step_name}`,
    phase.current_step_status && ` - ${phase.current_step_status}`,
  ]
    .filter(Boolean)
    .join("");

  return (
    <div className="relative flex flex-col items-center gap-1">
      <button
        className={cn(
          "group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-11 sm:w-11",
          cardStyles[phase.status],
          phase.status === "running" && "scale-110",
          hasDetails && "cursor-pointer hover:scale-105",
          isExpanded && "ring-2 ring-primary/50 ring-offset-2"
        )}
        disabled={!hasDetails}
        onClick={hasDetails ? onClick : undefined}
        title={tooltipText}
        type="button"
      >
        {showProgress && (
          <svg
            className="absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              className="stroke-blue-200 dark:stroke-blue-900"
              cx="50"
              cy="50"
              fill="none"
              r="45"
              strokeWidth="10"
            />
            <circle
              className="stroke-blue-600 dark:stroke-blue-400 transition-all duration-500"
              cx="50"
              cy="50"
              fill="none"
              r="45"
              strokeDasharray={`${progress * 2.827} 282.7`}
              strokeLinecap="round"
              strokeWidth="10"
            />
          </svg>
        )}

        <StatusIcon
          className={cn(
            "relative z-10 h-4 w-4 sm:h-5 sm:w-5",
            iconColors[phase.status],
            phase.status === "running" && "fill-current"
          )}
        />

        <div className="-bottom-0.5 -right-0.5 absolute z-20 flex h-4 w-4 items-center justify-center rounded-full bg-background font-bold text-[8px] shadow-sm ring-1 ring-border sm:h-[18px] sm:w-[18px] sm:text-[9px]">
          {phase.phase_number}
        </div>

        {hasDetails && (
          <div className="-top-0.5 -right-0.5 absolute z-20 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary/10 opacity-0 transition-opacity group-hover:opacity-100">
            <ChevronDown
              className={cn(
                "h-2 w-2 text-primary transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
          </div>
        )}
      </button>

      {showProgress && phase.current_step_name && (
        <div className="absolute -bottom-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-background/95 px-2 py-0.5 text-[10px] text-muted-foreground shadow-sm backdrop-blur-sm">
          {phase.current_step_name}
        </div>
      )}
    </div>
  );
}

function PhaseProgressPanelContent() {
  const { phases, models, webSources, webRefreshDetails } = useODAIContext();
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  const inferencePhase = phases.find((p) => p.phase === "inference");
  const canShowWaveProgress =
    inferencePhase &&
    (inferencePhase.status === "running" ||
      inferencePhase.status === "completed") &&
    models.length > 0;

  const preAnalysisPhase = phases.find((p) => p.phase === "pre_analysis");
  const canShowWebSources =
    preAnalysisPhase &&
    (preAnalysisPhase.status === "running" ||
      preAnalysisPhase.status === "completed") &&
    webSources.length > 0;

  return (
    <>
      <div className="flex items-center justify-center px-2 md:px-4">
        {phases.map((phase, index) => (
          <div className="flex items-center" key={phase.phase}>
            <PhaseIndicator
              isExpanded={expandedPhase === phase.phase}
              onClick={() =>
                setExpandedPhase(
                  expandedPhase === phase.phase ? null : phase.phase
                )
              }
              phase={phase}
            />
            {index < phases.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-6 transition-colors duration-300 sm:w-8",
                  phase.status === "completed"
                    ? "bg-green-500/50"
                    : phase.status === "running"
                      ? "bg-blue-500/50"
                      : "bg-border/30"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <ResponsiveSheet
        description={`${webSources.length} sources found during pre-analysis`}
        onOpenChange={(open) => {
          if (!open) setExpandedPhase(null);
        }}
        open={Boolean(expandedPhase === "pre_analysis" && canShowWebSources)}
        title="Web Sources"
      >
        <WebSourcesPanel sources={webSources} />
      </ResponsiveSheet>

      <ResponsiveSheet
        description="Multi-model parallel inference progress"
        onOpenChange={(open) => {
          if (!open) setExpandedPhase(null);
        }}
        open={Boolean(expandedPhase === "inference" && canShowWaveProgress)}
        title="Model Execution"
      >
        <div className="space-y-6">
          {webRefreshDetails && (
            <WebRefreshDisplay details={webRefreshDetails} />
          )}

          <WaveProgressDisplay models={models} />
          <ModelExecutionTable models={models} />
        </div>
      </ResponsiveSheet>
    </>
  );
}

export const PhaseProgressPanel = memo(PhaseProgressPanelContent);
