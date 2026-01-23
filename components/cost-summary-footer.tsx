"use client";

import { memo } from "react";
import type { CostSummaryEvent } from "@/lib/ai/odai-types";
import { formatCost, formatTokens } from "@/lib/formatters";

interface CostSummaryFooterProps {
  summary: CostSummaryEvent;
}

function PureCostSummaryFooter({ summary }: CostSummaryFooterProps) {
  console.log("[CostSummaryFooter] Rendering with summary:", summary);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 font-mono text-muted-foreground text-xs">
      <span className="font-semibold text-foreground">
        {formatCost(summary.total_cost_usd)}
      </span>
      <span>·</span>
      <span>{formatTokens(summary.total_tokens)}</span>
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
