"use client";

import { memo } from "react";
import type { CostSummaryEvent } from "@/lib/ai/odai-types";

interface CostSummaryFooterProps {
  summary: CostSummaryEvent;
}

function PureCostSummaryFooter({ summary }: CostSummaryFooterProps) {
  console.log("[CostSummaryFooter] Rendering with summary:", summary);
  
  const formatCost = (cost: number) => {
    if (cost >= 0.01) {
      return `$${cost.toFixed(4)}`;
    }
    return `$${cost.toFixed(6)}`;
  };

  const formatTokens = (tokens: number) => {
    return tokens.toLocaleString();
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 font-mono text-muted-foreground text-xs">
      <span className="font-semibold text-foreground">
        {formatCost(summary.total_cost_usd)}
      </span>
      <span>·</span>
      <span>{formatTokens(summary.total_tokens)} tokens</span>
      <span className="text-muted-foreground/60">
        ({formatTokens(summary.input_tokens)} in / {formatTokens(summary.output_tokens)} out
        {summary.thinking_tokens > 0 && (
          <> / {formatTokens(summary.thinking_tokens)} thinking</>
        )}
        )
      </span>
    </div>
  );
}

export const CostSummaryFooter = memo(PureCostSummaryFooter);
