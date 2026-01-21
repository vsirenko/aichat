"use client";

import { memo } from "react";
import type { PhaseMetrics } from "@/lib/ai/odai-types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PhaseMetricsDisplayProps {
  metrics: PhaseMetrics;
  compact?: boolean;
}

function PurePhaseMetricsDisplay({ metrics, compact = false }: PhaseMetricsDisplayProps) {
  if (compact) {
    return (
      <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
        <h4 className="font-semibold text-sm">Metrics</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <MetricItem label="Total Cost" value={`$${(metrics.total_cost_usd ?? 0).toFixed(4)}`} />
          <MetricItem label="Total Tokens" value={(metrics.total_input_tokens ?? 0) + (metrics.total_output_tokens ?? 0)} />
          <MetricItem label="LLM Calls" value={`${metrics.successful_llm_calls ?? 0}/${metrics.total_llm_calls ?? 0}`} />
          {(metrics.total_thinking_tokens ?? 0) > 0 && (
            <MetricItem label="Thinking Tokens" value={metrics.total_thinking_tokens ?? 0} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <h4 className="font-semibold text-sm">Phase Metrics</h4>

      {/* Cost Breakdown */}
      <div className="space-y-2">
        <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Cost Breakdown
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricItem label="LLM Cost" value={`$${(metrics.llm_cost_usd ?? 0).toFixed(4)}`} />
          <MetricItem label="Tool Cost" value={`$${(metrics.tool_cost_usd ?? 0).toFixed(4)}`} />
          <MetricItem 
            label="Total Cost" 
            value={`$${(metrics.total_cost_usd ?? 0).toFixed(4)}`}
            valueClassName="font-bold text-blue-600 dark:text-blue-400"
          />
          <MetricItem label="Duration" value={`${((metrics.duration_ms ?? 0) / 1000).toFixed(2)}s`} />
        </div>
      </div>

      {/* Token Usage */}
      <div className="space-y-2">
        <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Token Usage
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricItem label="Input Tokens" value={(metrics.total_input_tokens ?? 0).toLocaleString()} />
          <MetricItem label="Output Tokens" value={(metrics.total_output_tokens ?? 0).toLocaleString()} />
          {(metrics.total_thinking_tokens ?? 0) > 0 && (
            <MetricItem label="Thinking Tokens" value={(metrics.total_thinking_tokens ?? 0).toLocaleString()} />
          )}
          <MetricItem 
            label="Total Tokens" 
            value={((metrics.total_input_tokens ?? 0) + (metrics.total_output_tokens ?? 0) + (metrics.total_thinking_tokens ?? 0)).toLocaleString()}
            valueClassName="font-bold"
          />
        </div>
      </div>

      {/* LLM Calls */}
      <div className="space-y-2">
        <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          LLM Calls
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricItem label="Total" value={metrics.total_llm_calls ?? 0} />
          <MetricItem 
            label="Successful" 
            value={metrics.successful_llm_calls ?? 0}
            valueClassName="text-green-600 dark:text-green-400"
          />
          <MetricItem 
            label="Failed" 
            value={metrics.failed_llm_calls ?? 0}
            valueClassName={(metrics.failed_llm_calls ?? 0) > 0 ? "text-red-600 dark:text-red-400" : ""}
          />
        </div>
      </div>

      {/* Tool Calls */}
      {(metrics.total_tool_calls ?? 0) > 0 && (
        <div className="space-y-2">
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Tool Usage
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MetricItem label="Total Calls" value={metrics.total_tool_calls ?? 0} />
            {(metrics.queries_searched ?? 0) > 0 && (
              <MetricItem label="Searches" value={metrics.queries_searched ?? 0} />
            )}
            {(metrics.sources_scraped ?? 0) > 0 && (
              <MetricItem label="Scraped" value={metrics.sources_scraped ?? 0} />
            )}
          </div>
        </div>
      )}

      {/* Models & Providers */}
      {(metrics.models_used?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Models Used
          </div>
          <div className="flex flex-wrap gap-2">
            {(metrics.models_used ?? []).map((model, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {model}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {(metrics.providers_used?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Providers
          </div>
          <div className="flex flex-wrap gap-2">
            {(metrics.providers_used ?? []).map((provider, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {provider}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricItem({
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
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className={cn("font-semibold text-sm", valueClassName)}>
        {value}
      </div>
    </div>
  );
}

export const PhaseMetricsDisplay = memo(PurePhaseMetricsDisplay);
