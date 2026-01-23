"use client";

import { memo } from "react";
import type { PhaseState } from "@/lib/types";
import type { PhaseMetrics } from "@/lib/ai/odai-types";
import { cn } from "@/lib/utils";
import { 
  getPrimaryDomain, 
  getSecondaryDomains, 
  getModelList,
  getLlmCallCounts,
  getPhaseMetrics 
} from "@/lib/ai/phase-utils";
import { 
  formatBoolean, 
  formatStatus, 
  formatExecutionMode, 
  formatTokens, 
  formatCost, 
  formatDuration,
  formatDomain,
  formatEnhancement
} from "@/lib/formatters";
import { PhaseMetricsDisplay } from "./phase-metrics-display";
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

  const duration = phase.duration_ms
    ? formatDuration(phase.duration_ms)
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
            <DetailItem label="Duration" value={duration} />
            <DetailItem
              label="Success"
              value={formatBoolean(phase.status === "completed")}
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

  const metrics = getPhaseMetrics(details);
  const safety = details.safety as Record<string, unknown> | undefined;
  const odai = details.odai as Record<string, unknown> | undefined;
  
  const decision = (safety?.decision as string) ?? (details.decision as string) ?? "N/A";
  const isOdaiRelated = (odai?.is_odai_related as boolean) ?? false;
  const queryEnhanced = (details.query_enhanced as boolean) ?? undefined;

  return (
    <div className="space-y-4">
      {metrics && <PhaseMetricsDisplay metrics={metrics} compact />}
      
      <h3 className="font-semibold text-sm">Safety Classification</h3>
      <div className="grid grid-cols-2 gap-4">
        <DetailItem
          label="Safety Decision"
          value={formatStatus(decision)}
          valueClassName={
            decision === "allow"
              ? "text-green-600 dark:text-green-500"
              : "text-red-600 dark:text-red-500"
          }
        />
        <DetailItem
          label="ODAI Query"
          value={formatBoolean(isOdaiRelated)}
          valueClassName={
            isOdaiRelated
              ? "text-blue-600 dark:text-blue-400"
              : "text-muted-foreground"
          }
        />
        {queryEnhanced !== undefined && (
          <DetailItem
            label="Query Enhanced"
            value={formatBoolean(queryEnhanced)}
            valueClassName={
              queryEnhanced
                ? "text-blue-600 dark:text-blue-400"
                : "text-muted-foreground"
            }
          />
        )}
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

  const metrics = getPhaseMetrics(details);
  const complexity = details.complexity as Record<string, unknown> | undefined;
  const domain = details.domain as Record<string, unknown> | undefined;
  const extraction = details.extraction as Record<string, unknown> | undefined;
  const webSearch = details.web_search as Record<string, unknown> | undefined;

  const complexityScore = complexity?.score as number | undefined;
  const primaryDomain = getPrimaryDomain(domain);
  const secondaryDomains = getSecondaryDomains(domain);
  const urlsExtracted = (extraction?.urls_extracted as number) ?? (extraction?.urls as number) ?? 0;
  const webSearchRequired = webSearch?.required as boolean | undefined;

  return (
    <div className="space-y-4">
      {metrics && <PhaseMetricsDisplay metrics={metrics} compact />}
      
      <h3 className="font-semibold text-sm">Analysis Results</h3>
      <div className="grid grid-cols-2 gap-4">
        <DetailItem
          label="Complexity Score"
          value={complexityScore !== undefined ? complexityScore : "N/A"}
        />
        <DetailItem
          label="Primary Domain"
          value={formatDomain(primaryDomain)}
        />
        <DetailItem
          label="URLs Extracted"
          value={urlsExtracted}
        />
        <DetailItem
          label="Web Search Required"
          value={formatBoolean(webSearchRequired ?? false)}
          valueClassName={
            webSearchRequired
              ? "text-blue-600 dark:text-blue-400"
              : "text-muted-foreground"
          }
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
                {formatDomain(domain)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BudgetPhaseDetails({ details }: { details?: Record<string, unknown> }) {
  if (!details) return null;

  const metrics = getPhaseMetrics(details);
  const budget = details.budget as Record<string, unknown> | undefined;
  const decomposition = details.decomposition as Record<string, unknown> | undefined;
  
  const estimatedCost = budget?.estimated_cost_usd as number | undefined;
  const reasoningBudget = budget?.reasoning_budget as number | undefined;
  const sampleCount = budget?.sample_count as number | undefined;
  const modelList = getModelList(details);
  const executionMode = (decomposition?.execution_mode as string) ?? (details.execution_mode as string);
  const subTaskCount = (decomposition?.sub_task_count as number) ?? (decomposition?.subtasks as number);

  return (
    <div className="space-y-4">
      {metrics && <PhaseMetricsDisplay metrics={metrics} compact />}
      
      <h3 className="font-semibold text-sm">Compute Allocation</h3>
      <div className="grid grid-cols-2 gap-4">
        <DetailItem
          label="Estimated Cost"
          value={estimatedCost !== undefined ? formatCost(estimatedCost) : "N/A"}
          valueClassName="text-green-600 dark:text-green-500"
        />
        <DetailItem
          label="Reasoning Budget"
          value={reasoningBudget !== undefined ? formatTokens(reasoningBudget) : "N/A"}
        />
        <DetailItem
          label="Sample Count"
          value={sampleCount !== undefined ? sampleCount : "N/A"}
        />
        <DetailItem
          label="Model Count"
          value={modelList.length}
        />
        {executionMode && (
          <DetailItem
            label="Execution Mode"
            value={formatExecutionMode(executionMode)}
          />
        )}
        {subTaskCount !== undefined && subTaskCount > 0 && (
          <DetailItem
            label="Sub-tasks"
            value={subTaskCount}
          />
        )}
      </div>
      {modelList.length > 0 && (
        <div className="space-y-1">
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Model Roster
          </div>
          <div className="flex flex-wrap gap-2">
            {modelList.map((model, i) => (
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

function PromptsPhaseDetails({
  details,
}: {
  details?: Record<string, unknown>;
}) {
  if (!details) return null;

  const metrics = getPhaseMetrics(details);
  const promptEngineering = details.prompt_engineering as Record<string, unknown> | undefined;
  
  const executionMode = (promptEngineering?.execution_mode as string) ?? (details.execution_mode as string) ?? "N/A";
  const promptsGenerated = (promptEngineering?.total_prompts_generated as number) ?? (details.prompts_generated as number) ?? 0;
  const llmEnhancementApplied = (promptEngineering?.llm_enhancement_applied as boolean) ?? false;
  const llmEnhancementModel = (promptEngineering?.llm_enhancement_model as string) ?? null;

  return (
    <div className="space-y-4">
      {metrics && <PhaseMetricsDisplay metrics={metrics} compact />}
      
      <h3 className="font-semibold text-sm">Prompt Engineering</h3>
      <div className="grid grid-cols-2 gap-4">
        <DetailItem
          label="Execution Mode"
          value={formatExecutionMode(executionMode)}
        />
        <DetailItem
          label="Prompts Generated"
          value={promptsGenerated}
        />
        <DetailItem
          label="LLM Enhancement"
          value={formatEnhancement(llmEnhancementApplied)}
          valueClassName={
            llmEnhancementApplied
              ? "text-blue-600 dark:text-blue-400"
              : "text-muted-foreground"
          }
        />
        {llmEnhancementModel && (
          <DetailItem
            label="Enhancer"
            value={llmEnhancementModel}
          />
        )}
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

  const metrics = getPhaseMetrics(details);
  const inference = details.inference as Record<string, unknown> | undefined;
  const webRefresh = details.web_context_refresh as Record<string, unknown> | undefined;
  
  const executionMode = (inference?.execution_mode as string) ?? (details.execution_mode as string) ?? "N/A";
  const multiSampling = (inference?.multi_sampling_applied as boolean) ?? (details.multi_sampling_applied as boolean) ?? false;
  const { successful, failed } = getLlmCallCounts(details);
  const refreshExecuted = (webRefresh?.refresh_executed as boolean) ?? false;
  const promptsRefreshed = (webRefresh?.prompts_refreshed as number) ?? 0;

  return (
    <div className="space-y-4">
      {metrics && <PhaseMetricsDisplay metrics={metrics} compact />}
      
      <h3 className="font-semibold text-sm">Inference Execution</h3>
      <div className="grid grid-cols-2 gap-4">
        <DetailItem
          label="Execution Mode"
          value={formatExecutionMode(executionMode)}
        />
        <DetailItem
          label="Successful Calls"
          value={successful}
          valueClassName="text-green-600 dark:text-green-500"
        />
        <DetailItem
          label="Failed Calls"
          value={failed}
          valueClassName={failed > 0 ? "text-red-600 dark:text-red-500" : ""}
        />
        <DetailItem
          label="Multi-Sampling"
          value={formatBoolean(multiSampling)}
          valueClassName={
            multiSampling
              ? "text-blue-600 dark:text-blue-400"
              : "text-muted-foreground"
          }
        />
      </div>
      
      {refreshExecuted && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Web Context Refresh</h4>
          <div className="grid grid-cols-2 gap-4">
            <DetailItem
              label="Prompts Refreshed"
              value={promptsRefreshed}
            />
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

  const metrics = getPhaseMetrics(details);
  const ranking = details.ranking as Record<string, unknown> | undefined;
  const selection = details.selection as Record<string, unknown> | undefined;
  const aggregation = details.aggregation as Record<string, unknown> | undefined;

  const samplesRanked = (ranking?.total_samples_ranked as number) ?? (details.samples_ranked as number) ?? 0;
  const winnerModel = (selection?.winner_model as string) ?? "N/A";
  const rankingScore = (selection?.ranking_score as number) ?? undefined;
  const aggregationPerformed = (aggregation?.aggregation_performed as boolean) ?? false;
  const aggregationModel = (aggregation?.aggregation_model as string) ?? null;

  return (
    <div className="space-y-4">
      {metrics && <PhaseMetricsDisplay metrics={metrics} compact />}
      
      <h3 className="font-semibold text-sm">Sample Selection</h3>
      <div className="grid grid-cols-2 gap-4">
        <DetailItem
          label="Responses Evaluated"
          value={samplesRanked}
        />
        <DetailItem
          label="Selected Model"
          value={winnerModel}
          valueClassName="text-blue-600 dark:text-blue-400"
        />
        {rankingScore !== undefined && (
          <DetailItem
            label="Quality Score"
            value={rankingScore.toFixed(2)}
          />
        )}
        <DetailItem
          label="Aggregation"
          value={formatBoolean(aggregationPerformed)}
          valueClassName={
            aggregationPerformed
              ? "text-green-600 dark:text-green-500"
              : "text-muted-foreground"
          }
        />
      </div>
      {aggregationModel && (
        <div className="space-y-1">
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Aggregation Model
          </div>
          <span className="rounded-full bg-muted px-2 py-1 font-mono text-xs">
            {aggregationModel}
          </span>
        </div>
      )}
    </div>
  );
}

export const PhaseDetailModal = memo(PurePhaseDetailModal);

