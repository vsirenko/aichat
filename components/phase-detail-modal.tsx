"use client";

import { memo } from "react";
import type { PhaseState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ResponsiveSheet } from "./ui/responsive-sheet";

interface PhaseDetailModalProps {
  phase: PhaseState | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PurePhaseDetailModal({
  phase,
  open,
  onOpenChange,
}: PhaseDetailModalProps) {
  if (!phase) return null;

  const durationSeconds = phase.duration_ms
    ? (phase.duration_ms / 1000).toFixed(2)
    : "N/A";

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Phase ${phase.phase_number}: ${phase.phase_name}`}
      description="Detailed phase execution summary"
    >
      <div className="space-y-6 py-4">
          {/* Common Fields */}
          <div className="grid grid-cols-2 gap-4">
            <DetailItem label="Duration" value={`${durationSeconds}s`} />
            <DetailItem
              label="Success"
              value={phase.status === "completed" ? "true" : "false"}
              valueClassName={
                phase.status === "completed"
                  ? "text-green-600 dark:text-green-500"
                  : "text-red-600 dark:text-red-500"
              }
            />
          </div>

          {/* Phase-Specific Details */}
          {phase.phase === "safety" && (
            <SafetyPhaseDetails details={phase.details} />
          )}
          {phase.phase === "pre_analysis" && (
            <PreAnalysisPhaseDetails details={phase.details} />
          )}
          {phase.phase === "budget_allocation" && (
            <BudgetPhaseDetails details={phase.details} />
          )}
          {phase.phase === "prompt_engineering" && (
            <PromptsPhaseDetails details={phase.details} />
          )}
          {phase.phase === "inference" && (
            <InferencePhaseDetails details={phase.details} />
          )}
          {phase.phase === "selection" && (
            <SelectionPhaseDetails details={phase.details} />
          )}
        </div>
    </ResponsiveSheet>
  );
}

function DetailItem({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string | number;
  valueClassName?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </div>
      <div className={cn("font-semibold text-sm", valueClassName)}>
        {value}
      </div>
    </div>
  );
}

function SafetyPhaseDetails({ details }: { details?: Record<string, unknown> }) {
  if (!details) return null;

  const decision = (details.decision as string) || "N/A";

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">Safety Classification</h3>
      <div className="grid grid-cols-1 gap-4">
        <DetailItem
          label="Decision"
          value={decision}
          valueClassName={
            decision === "allowed"
              ? "text-green-600 dark:text-green-500"
              : "text-red-600 dark:text-red-500"
          }
        />
      </div>
    </div>
  );
}

function PreAnalysisPhaseDetails({
  details,
}: {
  details?: Record<string, unknown>;
}) {
  if (!details) return null;

  const complexity = details.complexity as Record<string, unknown> | undefined;
  const domain = details.domain as Record<string, unknown> | undefined;
  const webSearch = details.web_search as Record<string, unknown> | undefined;

  const complexityScore = complexity?.score as number | undefined;
  const primaryDomain = domain?.primary as string | undefined;
  const secondaryDomains = (domain?.secondary as string[]) || [];
  const webSearchRequired = webSearch?.required as boolean | undefined;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">Analysis Results</h3>
      <div className="grid grid-cols-2 gap-4">
        <DetailItem
          label="Complexity Score"
          value={complexityScore !== undefined ? complexityScore : "N/A"}
        />
        <DetailItem
          label="Primary Domain"
          value={primaryDomain || "N/A"}
        />
      </div>
      {secondaryDomains.length > 0 && (
        <div className="space-y-1">
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Secondary Domains
          </div>
          <div className="flex flex-wrap gap-2">
            {secondaryDomains.slice(0, 3).map((domain, i) => (
              <span
                key={i}
                className="rounded-full bg-muted px-2 py-1 text-xs"
              >
                {domain}
              </span>
            ))}
          </div>
        </div>
      )}
      <DetailItem
        label="Web Search Required"
        value={webSearchRequired !== undefined ? String(webSearchRequired) : "N/A"}
        valueClassName={
          webSearchRequired
            ? "text-blue-600 dark:text-blue-400"
            : "text-muted-foreground"
        }
      />
    </div>
  );
}

function BudgetPhaseDetails({ details }: { details?: Record<string, unknown> }) {
  if (!details) return null;

  const budget = details.budget as Record<string, unknown> | undefined;
  const estimatedCost = budget?.estimated_cost_usd as number | undefined;
  const reasoningBudget = budget?.reasoning_budget as number | undefined;
  const sampleCount = budget?.sample_count as number | undefined;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">Budget Allocation</h3>
      <div className="grid grid-cols-2 gap-4">
        <DetailItem
          label="Estimated Cost"
          value={
            estimatedCost !== undefined
              ? `$${estimatedCost.toFixed(4)}`
              : "N/A"
          }
          valueClassName="text-green-600 dark:text-green-500"
        />
        <DetailItem
          label="Reasoning Budget"
          value={
            reasoningBudget !== undefined
              ? `${reasoningBudget.toLocaleString()} tokens`
              : "N/A"
          }
        />
        <DetailItem
          label="Sample Count"
          value={sampleCount !== undefined ? sampleCount : "N/A"}
        />
      </div>
    </div>
  );
}

function PromptsPhaseDetails({
  details,
}: {
  details?: Record<string, unknown>;
}) {
  if (!details) return null;

  const executionMode = details.execution_mode as string | undefined;
  const promptsGenerated = details.prompts_generated as number | undefined;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">Prompt Engineering</h3>
      <div className="grid grid-cols-2 gap-4">
        <DetailItem
          label="Execution Mode"
          value={executionMode || "N/A"}
        />
        <DetailItem
          label="Prompts Generated"
          value={promptsGenerated !== undefined ? promptsGenerated : "N/A"}
        />
      </div>
    </div>
  );
}

function InferencePhaseDetails({
  details,
}: {
  details?: Record<string, unknown>;
}) {
  if (!details) return null;

  const executionMode = details.execution_mode as string | undefined;
  const llmCalls = details.llm_calls as Record<string, unknown> | undefined;
  const modelsUsed = (details.models_used as string[]) || [];
  const tokens = details.tokens as Record<string, unknown> | undefined;
  const multiSampling = details.multi_sampling_applied as boolean | undefined;

  const totalCalls = llmCalls?.total as number | undefined;
  const totalTokens = tokens?.total as number | undefined;
  const thinkingTokens = tokens?.thinking as number | undefined;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">Inference Execution</h3>
      <div className="grid grid-cols-2 gap-4">
        <DetailItem
          label="Execution Mode"
          value={executionMode || "N/A"}
        />
        <DetailItem
          label="Total LLM Calls"
          value={totalCalls !== undefined ? totalCalls : "N/A"}
        />
        <DetailItem
          label="Total Tokens"
          value={
            totalTokens !== undefined ? totalTokens.toLocaleString() : "N/A"
          }
        />
        <DetailItem
          label="Thinking Tokens"
          value={
            thinkingTokens !== undefined
              ? thinkingTokens.toLocaleString()
              : "N/A"
          }
        />
        <DetailItem
          label="Multi-Sampling"
          value={multiSampling !== undefined ? String(multiSampling) : "N/A"}
          valueClassName={
            multiSampling
              ? "text-blue-600 dark:text-blue-400"
              : "text-muted-foreground"
          }
        />
      </div>
      {modelsUsed.length > 0 && (
        <div className="space-y-1">
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Models Used
          </div>
          <div className="flex flex-wrap gap-2">
            {modelsUsed.map((model, i) => (
              <span
                key={i}
                className="rounded-full bg-muted px-2 py-1 font-mono text-xs"
              >
                {model}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SelectionPhaseDetails({
  details,
}: {
  details?: Record<string, unknown>;
}) {
  if (!details) return null;

  const samplesRanked = details.samples_ranked as number | undefined;
  const aggregation = details.aggregation as Record<string, unknown> | undefined;
  const timing = details.timing as Record<string, unknown> | undefined;

  const aggregationPerformed = aggregation?.performed as boolean | undefined;
  const rankingDuration = timing?.ranking_duration_ms as number | undefined;
  const selectionDuration = timing?.selection_duration_ms as number | undefined;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">Response Selection</h3>
      <div className="grid grid-cols-2 gap-4">
        <DetailItem
          label="Samples Ranked"
          value={samplesRanked !== undefined ? samplesRanked : "N/A"}
        />
        <DetailItem
          label="Aggregation Performed"
          value={
            aggregationPerformed !== undefined
              ? String(aggregationPerformed)
              : "N/A"
          }
          valueClassName={
            aggregationPerformed
              ? "text-green-600 dark:text-green-500"
              : "text-muted-foreground"
          }
        />
        <DetailItem
          label="Ranking Duration"
          value={
            rankingDuration !== undefined
              ? `${(rankingDuration / 1000).toFixed(2)}s`
              : "N/A"
          }
        />
        <DetailItem
          label="Selection Duration"
          value={
            selectionDuration !== undefined
              ? `${(selectionDuration / 1000).toFixed(2)}s`
              : "N/A"
          }
        />
      </div>
    </div>
  );
}

export const PhaseDetailModal = memo(PurePhaseDetailModal);

