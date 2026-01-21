"use client";

import { CheckCircle2, Circle, Clock, Trash2, XCircle } from "lucide-react";
import { memo, useState } from "react";
import type { HistoryEntry } from "@/hooks/use-history";
import { cn } from "@/lib/utils";
import { ModelExecutionTable } from "./model-execution-table";
import { PhaseDetailModal } from "./phase-detail-modal";
import { PhaseStepDetail } from "./phase-step-detail";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { WaveProgressDisplay } from "./wave-progress-display";
import { WebRefreshDisplay } from "./web-refresh-display";
import { WebSourcesPanel } from "./web-sources-panel";

interface HistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: HistoryEntry[];
  onClearHistory: () => void;
  onRemoveEntry: (id: string) => void;
}

function PhaseIndicatorSmall({
  phase,
  onClick,
}: {
  phase: HistoryEntry["phases"][0];
  onClick?: () => void;
}) {
  const StatusIcon = {
    pending: Circle,
    running: Circle,
    completed: CheckCircle2,
    failed: XCircle,
  }[phase.status];

  const iconColors = {
    pending: "text-muted-foreground/40",
    running: "text-[#3B43FE]",
    completed: "text-[#D6FFA6] dark:text-[#74885C]",
    failed: "text-red-600 dark:text-red-500",
  };

  return (
    <button
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
        phase.status === "completed" && "border-[#D6FFA6]/50",
        phase.status === "running" && "border-[#3B43FE]/50",
        phase.status === "failed" && "border-red-500/50",
        phase.status === "pending" && "border-border/40",
        onClick && "cursor-pointer hover:scale-105"
      )}
      disabled={!onClick}
      onClick={onClick}
      title={phase.phase_name}
      type="button"
    >
      <StatusIcon className={cn("h-3 w-3", iconColors[phase.status])} />
    </button>
  );
}

function HistoryEntryCard({
  entry,
  onRemove,
}: {
  entry: HistoryEntry;
  onRemove: () => void;
}) {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [selectedPhaseForModal, setSelectedPhaseForModal] = useState<
    HistoryEntry["phases"][0] | null
  >(null);

  const completedPhases = entry.phases.filter((p) => p.status === "completed");
  const timestamp = new Date(entry.timestamp);
  const timeStr = timestamp.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = timestamp.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const inferencePhase = entry.phases.find((p) => p.phase === "inference");
  const preAnalysisPhase = entry.phases.find((p) => p.phase === "pre_analysis");

  return (
    <>
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Clock className="h-3 w-3" />
              <span>
                {timeStr} · {dateStr}
              </span>
            </div>
            {entry.userQuery && (
              <p className="mt-2 text-foreground text-sm line-clamp-2">
                {entry.userQuery}
              </p>
            )}
          </div>
          <Button
            onClick={onRemove}
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {entry.phases.map((phase, index) => (
            <div className="flex items-center" key={phase.phase}>
              <PhaseIndicatorSmall
                onClick={
                  phase.status === "completed"
                    ? () => {
                        if (
                          phase.phase === "inference" &&
                          entry.models.length > 0
                        ) {
                          setExpandedPhase(
                            expandedPhase === phase.phase ? null : phase.phase
                          );
                        } else if (
                          phase.phase === "pre_analysis" &&
                          entry.webSources.length > 0
                        ) {
                          setExpandedPhase(
                            expandedPhase === phase.phase ? null : phase.phase
                          );
                        } else if (phase.details) {
                          setSelectedPhaseForModal(phase);
                        }
                      }
                    : undefined
                }
                phase={phase}
              />
              {index < entry.phases.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-4",
                    phase.status === "completed"
                      ? "bg-[#D6FFA6]/30"
                      : "bg-border/20"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-2 text-muted-foreground text-xs">
          {completedPhases.length}/{entry.phases.length} phases completed
        </div>

        {/* Expanded content for inference */}
        {expandedPhase === "inference" && entry.models.length > 0 && (
          <div className="mt-4 space-y-4 border-t pt-4">
            {entry.webRefreshDetails && (
              <WebRefreshDisplay details={entry.webRefreshDetails} />
            )}
            <WaveProgressDisplay models={entry.models} />
            <ModelExecutionTable models={entry.models} />
          </div>
        )}

        {/* Expanded content for pre-analysis */}
        {expandedPhase === "pre_analysis" && entry.webSources.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <WebSourcesPanel sources={entry.webSources} />
          </div>
        )}
      </div>

      <PhaseDetailModal
        onOpenChange={(open) => {
          if (!open) setSelectedPhaseForModal(null);
        }}
        open={selectedPhaseForModal !== null}
        phase={selectedPhaseForModal}
      />
    </>
  );
}

function PureHistoryDrawer({
  open,
  onOpenChange,
  history,
  onClearHistory,
  onRemoveEntry,
}: HistoryDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Thinking History</SheetTitle>
          <SheetDescription>
            View previous thinking stages and phases. History clears when you
            leave the site.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {history.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  {history.length} {history.length === 1 ? "entry" : "entries"}
                </p>
                <Button
                  onClick={onClearHistory}
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                >
                  Clear All
                </Button>
              </div>
              {history.map((entry) => (
                <HistoryEntryCard
                  entry={entry}
                  key={entry.id}
                  onRemove={() => onRemoveEntry(entry.id)}
                />
              ))}
            </>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground text-sm">
                No history yet. Your thinking stages will appear here.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export const HistoryDrawer = memo(PureHistoryDrawer);
