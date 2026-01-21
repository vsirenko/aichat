"use client";

import { memo } from "react";
import type { CostEstimateEvent } from "@/lib/ai/odai-types";
import { cn } from "@/lib/utils";
import { CpuIcon } from "./icons";

interface CostEstimateDisplayProps {
  estimate: CostEstimateEvent;
}

function PureCostEstimateDisplay({ estimate }: CostEstimateDisplayProps) {
  const tierColors = {
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    medium:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    extreme: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    frontier: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  };

  return (
    <div className="rounded-lg border bg-muted/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">Cost Estimate</h4>
        <span
          className={cn(
            "rounded-full px-2 py-1 font-semibold text-xs uppercase",
            tierColors[estimate.complexity_tier]
          )}
        >
          {estimate.complexity_tier}
        </span>
      </div>

      <div className="mb-4 font-bold text-3xl">
        ${estimate.estimated_cost_usd.toFixed(2)}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-muted-foreground">Estimated Tokens</div>
          <div className="font-semibold">
            {estimate.estimated_tokens.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">Model Count</div>
          <div className="flex items-center gap-1 font-semibold">
            <CpuIcon size={14} />
            {estimate.model_count}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">Sample Count</div>
          <div className="font-semibold">{estimate.sample_count}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Reasoning Budget</div>
          <div className="font-semibold">
            {estimate.reasoning_budget.toLocaleString()} tokens
          </div>
        </div>
      </div>

      {estimate.requires_confirmation && (
        <div className="mt-3 rounded-md border border-yellow-500 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-700 dark:text-yellow-300">
          ⚠️ This query requires budget confirmation
        </div>
      )}
    </div>
  );
}

export const CostEstimateDisplay = memo(PureCostEstimateDisplay);
