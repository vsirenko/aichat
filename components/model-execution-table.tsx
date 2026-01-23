"use client";

import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { memo } from "react";
import type { ModelExecution } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatProvider, formatTokens, formatDuration, formatStatus } from "@/lib/formatters";

interface ModelExecutionTableProps {
  models: ModelExecution[];
}

function PureModelExecutionTable({ models }: ModelExecutionTableProps) {
  if (models.length === 0) {
    return null;
  }

  const StatusIcon = {
    pending: Circle,
    running: Loader2,
    completed: CheckCircle2,
    failed: XCircle,
  };

  const statusColors = {
    pending: "text-muted-foreground",
    running: "text-blue-600 dark:text-blue-400",
    completed: "text-green-600 dark:text-green-500",
    failed: "text-red-600 dark:text-red-500",
  };

  return (
    <div className="space-y-3">
      <div className="font-medium text-muted-foreground text-sm">
        Model Details
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-xs">
                Model
              </th>
              <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-xs">
                Status
              </th>
              <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-xs">
                Tokens
              </th>
              <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-xs">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {models.map((model, index) => {
              const Icon = StatusIcon[model.status];
              const colorClass = statusColors[model.status];
              const label = formatStatus(model.status);

              return (
                <tr
                  className="transition-colors hover:bg-muted/30"
                  key={`${model.model_id}-${index}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {model.model_id}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatProvider(model.provider)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          colorClass,
                          model.status === "running" && "animate-spin"
                        )}
                      />
                      <span className={cn("font-medium text-sm", colorClass)}>
                        {label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">
                      {model.tokens_used
                        ? formatTokens(model.tokens_used)
                        : model.status === "running"
                          ? "..."
                          : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">
                      {model.duration_ms
                        ? formatDuration(model.duration_ms)
                        : model.status === "running"
                          ? "..."
                          : "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {}
      {models.some((m) => m.status === "completed") && (
        <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-2 text-xs">
          <span className="text-muted-foreground">Total Models:</span>
          <span className="font-medium">{models.length}</span>
          <span className="text-muted-foreground">Completed:</span>
          <span className="font-medium text-green-600 dark:text-green-500">
            {models.filter((m) => m.status === "completed").length}
          </span>
          {models.some((m) => m.tokens_used) && (
            <>
              <span className="text-muted-foreground">Total Tokens:</span>
              <span className="font-medium">
                {formatTokens(models.reduce((sum, m) => sum + (m.tokens_used || 0), 0))}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export const ModelExecutionTable = memo(PureModelExecutionTable);
