"use client";

import { CheckCircle2, ChevronDown, Circle, XCircle } from "lucide-react";
import { memo, useState } from "react";
import type { PhaseState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDuration, formatBoolean, formatCost, formatTokens } from "@/lib/formatters";
import { getPhaseMetrics } from "@/lib/ai/phase-utils";
import { ErrorAlert } from "./error-alert";
import { ModelExecutionTable } from "./model-execution-table";
import { useODAIContext } from "./odai-context";
import { PhaseDetailModal } from "./phase-detail-modal";
import { PhaseStepDetail } from "./phase-step-detail";
import { ResponsiveSheet } from "./ui/responsive-sheet";
import { WaveProgressDisplay } from "./wave-progress-display";
import { WebRefreshDisplay } from "./web-refresh-display";
import { WebScrapePanel } from "./web-scrape-panel";
import { WebSourcesPanel } from "./web-sources-panel";

function isPhaseClickable(phase: PhaseState): boolean {
  return (
    phase.status === "completed" ||
    phase.status === "failed" ||
    (phase.status === "running" && Boolean(phase.details))
  );
}

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
    running: "animate-pulse",
    completed: "",
    failed: "text-red-600 dark:text-red-500",
  };

  const cardStyles = {
    pending: "border-border/40 bg-muted/10",
    running: "border-[#3B43FE]/50 shadow-lg dark:border-[#989CF9]/50",
    completed: "border-[#3B43FE]/50 dark:border-[#D6FFA6]/50",
    failed: "border-red-500/50 bg-red-50/30 dark:bg-red-950/20",
  };

  const isInferencePhase = phase.phase === "inference";
  const isPreAnalysisPhase = phase.phase === "pre_analysis";
  const hasDetails = isPhaseClickable(phase);

  const progress = phase.progress_percent ?? 0;
  const showProgress = phase.status === "running";

  const tooltipText = [
    phase.phase_name,
    phase.duration_ms && ` - ${formatDuration(phase.duration_ms)}`,
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
              className="stroke-muted-foreground/20"
              cx="50"
              cy="50"
              fill="none"
              r="45"
              strokeWidth="10"
            />
            <circle
              className="transition-all duration-500 stroke-[#3B43FE] dark:stroke-[#989CF9]"
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
            phase.status === "running" && "fill-current text-[#3B43FE] dark:text-[#989CF9]",
            phase.status === "completed" && "text-[#3B43FE] dark:text-[#D6FFA6]"
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

      {phase.status === "running" && (
        <div className="absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 text-center">
          {phase.current_step_name ? (
            <>
              <div className="whitespace-nowrap text-xs font-medium text-foreground">
          {phase.current_step_name}
              </div>
              {phase.current_step_status && (
                <div className="whitespace-nowrap text-muted-foreground text-[10px] capitalize">
                  {phase.current_step_status.replace(/_/g, " ")}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="whitespace-nowrap text-xs font-medium text-foreground">
                {phase.phase_name}
              </div>
              <div className="whitespace-nowrap text-muted-foreground text-[10px]">
                In Progress
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PhaseProgressPanelContent() {
  const { phases, models, webSources, webScrapedSources, webRefreshDetails, errorEvents, phase1WebSources, phase1WebScrapedSources, phase4WebResults } = useODAIContext();
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [selectedPhaseForModal, setSelectedPhaseForModal] =
    useState<PhaseState | null>(null);

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

  const canShowWebScrape =
    preAnalysisPhase &&
    (preAnalysisPhase.status === "running" ||
      preAnalysisPhase.status === "completed") &&
    webScrapedSources.length > 0;

  const handlePhaseClick = (phase: PhaseState) => {
    if (phase.phase === "inference" && canShowWaveProgress) {
      setExpandedPhase(expandedPhase === phase.phase ? null : phase.phase);
    } else if (phase.phase === "pre_analysis" && (canShowWebSources || canShowWebScrape)) {
      setExpandedPhase(expandedPhase === phase.phase ? null : phase.phase);
    } else if (isPhaseClickable(phase)) {
      setSelectedPhaseForModal(phase);
    }
  };

  return (
    <>
      {/* Error Display */}
      {errorEvents.length > 0 && (
        <div className="space-y-2 px-4 pb-4">
          {errorEvents.map((error, index) => (
            <ErrorAlert key={index} error={error} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-center px-2 pb-12 md:px-4">
        {phases.map((phase, index) => (
          <div className="flex items-center" key={phase.phase}>
            <PhaseIndicator
              isExpanded={expandedPhase === phase.phase}
              onClick={() => handlePhaseClick(phase)}
              phase={phase}
            />
            {index < phases.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-6 transition-colors duration-300 sm:w-8",
                  phase.status === "completed"
                    ? "bg-[#3B43FE]/50 dark:bg-[#D6FFA6]/50"
                    : phase.status === "running"
                      ? "bg-[#3B43FE]/50 dark:bg-[#989CF9]/50"
                      : "bg-border/30"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <ResponsiveSheet
        description={
          canShowWebSources && canShowWebScrape
            ? `${webSources.length} sources found, ${webScrapedSources.length} URLs scraped`
            : canShowWebSources
              ? `${webSources.length} sources found during pre-analysis`
              : `${webScrapedSources.length} URLs scraped`
        }
        onOpenChange={(open) => {
          if (!open) setExpandedPhase(null);
        }}
        open={Boolean(expandedPhase === "pre_analysis" && (canShowWebSources || canShowWebScrape))}
        title="Web Research"
      >
        <div className="space-y-6">
          {canShowWebSources && <WebSourcesPanel sources={webSources} />}
          {canShowWebScrape && (
            <>
              {canShowWebSources && <div className="border-t" />}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Scraped URLs</h3>
                <WebScrapePanel sources={webScrapedSources} />
              </div>
            </>
          )}
        </div>
      </ResponsiveSheet>

      <ResponsiveSheet
        description="Phase Execution Summary"
        onOpenChange={(open) => {
          if (!open) setExpandedPhase(null);
        }}
        open={Boolean(expandedPhase === "inference" && canShowWaveProgress)}
        title="Phase 4: Parallel Inference"
      >
        <div className="space-y-6 py-4">
          {inferencePhase && (
            <>
              {/* Duration and Success */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Duration
                  </div>
                  <div className="font-semibold text-sm">
                    {inferencePhase.duration_ms
                      ? formatDuration(inferencePhase.duration_ms)
                      : "N/A"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Success
                  </div>
                  <div
                    className={cn(
                      "font-semibold text-sm",
                      inferencePhase.status === "completed"
                        ? "text-green-600 dark:text-green-500"
                        : "text-red-600 dark:text-red-500"
                    )}
                  >
                    {formatBoolean(inferencePhase.status === "completed")}
                  </div>
                </div>
              </div>

              {/* Metrics */}
              {inferencePhase.details && (() => {
                const metrics = getPhaseMetrics(inferencePhase.details);
                return metrics ? (
                  <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                    <h4 className="font-semibold text-sm">Metrics</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <div className="text-muted-foreground text-xs">Total Cost</div>
                        <div className="font-semibold text-sm">
                          {formatCost(metrics.total_cost_usd ?? 0)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground text-xs">Total Tokens</div>
                        <div className="font-semibold text-sm">
                          {formatTokens((metrics.total_input_tokens ?? 0) + (metrics.total_output_tokens ?? 0) + (metrics.total_thinking_tokens ?? 0))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground text-xs">API Calls</div>
                        <div className="font-semibold text-sm">
                          {`${metrics.successful_llm_calls ?? 0}/${metrics.total_llm_calls ?? 0}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Web Context Refresh */}
              {webRefreshDetails && (
                <WebRefreshDisplay details={webRefreshDetails} />
              )}

              {/* Phase 4 Web Results (per sub-task) */}
              {phase4WebResults.size > 0 && (
                <div className="space-y-4">
                  {Array.from(phase4WebResults.entries()).map(([subTaskKey, results]) => {
                    const totalSources = results.sources.length + results.scrapedSources.length;
                    if (totalSources === 0) return null;
                    
                    return (
                      <div key={subTaskKey} className="space-y-3 rounded-lg border bg-muted/30 p-4">
                        <h3 className="font-semibold text-sm">Web Search</h3>
                        <p className="text-muted-foreground text-xs">
                          {totalSources} {totalSources === 1 ? 'source' : 'sources'} found during pre-analysis
                        </p>
                        <div className="space-y-2">
                          {results.sources.map((source, i) => (
                            <a
                              key={`search-${i}`}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded border bg-background p-2 text-xs transition-colors hover:border-[#3B43FE]/50 dark:hover:border-[#D6FFA6]/50"
                            >
                              <div className="font-medium text-foreground">{source.title}</div>
                              <div className="mt-1 text-muted-foreground truncate">{source.url}</div>
                            </a>
                          ))}
                          {results.scrapedSources.map((source, i) => (
                            <a
                              key={`scrape-${i}`}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded border bg-background p-2 text-xs transition-colors hover:border-[#3B43FE]/50 dark:hover:border-[#D6FFA6]/50"
                            >
                              <div className="font-medium text-foreground">{source.title}</div>
                              <div className="mt-1 text-muted-foreground truncate">{source.url}</div>
                              {source.sub_links !== undefined && source.sub_links > 0 && (
                                <div className="mt-1 text-muted-foreground text-[10px]">
                                  +{source.sub_links} sub-links scraped
                                </div>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Wave Execution */}
              <WaveProgressDisplay models={models} />

              {/* Model Details */}
              <ModelExecutionTable models={models} />
            </>
          )}
        </div>
      </ResponsiveSheet>

      <PhaseDetailModal
        onOpenChange={(open) => {
          if (!open) setSelectedPhaseForModal(null);
        }}
        open={selectedPhaseForModal !== null}
        phase={selectedPhaseForModal}
        phase1WebSources={phase1WebSources}
        phase1WebScrapedSources={phase1WebScrapedSources}
      />
    </>
  );
}

export const PhaseProgressPanel = memo(PhaseProgressPanelContent);
