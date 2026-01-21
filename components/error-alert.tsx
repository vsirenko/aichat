"use client";

import { AlertCircleIcon, AlertTriangleIcon, XIcon } from "lucide-react";
import { memo, useState } from "react";
import type { ErrorEvent } from "@/lib/ai/odai-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ErrorAlertProps {
  error: ErrorEvent;
  onRetry?: () => void;
  onDismiss?: () => void;
}

function PureErrorAlert({ error, onRetry, onDismiss }: ErrorAlertProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  const isFatal = error.type === "fatal_error" || !error.recoverable;
  const Icon = isFatal ? AlertCircleIcon : AlertTriangleIcon;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        "relative rounded-lg border p-4",
        isFatal
          ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30"
          : "border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-950/30"
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn(
            "mt-0.5 h-5 w-5 shrink-0",
            isFatal
              ? "text-red-600 dark:text-red-400"
              : "text-yellow-600 dark:text-yellow-400"
          )}
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <h4
                className={cn(
                  "font-semibold text-sm",
                  isFatal
                    ? "text-red-900 dark:text-red-100"
                    : "text-yellow-900 dark:text-yellow-100"
                )}
              >
                {isFatal ? "Pipeline Error" : "Warning"}
                {error.phase && ` (${error.phase})`}
              </h4>
              <p
                className={cn(
                  "text-sm",
                  isFatal
                    ? "text-red-800 dark:text-red-200"
                    : "text-yellow-800 dark:text-yellow-200"
                )}
              >
                {error.message}
              </p>
            </div>
            <button
              className={cn(
                "shrink-0 rounded-md p-1 transition-colors",
                isFatal
                  ? "text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"
                  : "text-yellow-600 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-900/50"
              )}
              onClick={handleDismiss}
              type="button"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          {error.code && (
            <div
              className={cn(
                "font-mono text-xs",
                isFatal
                  ? "text-red-700 dark:text-red-300"
                  : "text-yellow-700 dark:text-yellow-300"
              )}
            >
              Error Code: {error.code}
            </div>
          )}

          {error.fallback_used && (
            <div
              className={cn(
                "text-xs",
                isFatal
                  ? "text-red-700 dark:text-red-300"
                  : "text-yellow-700 dark:text-yellow-300"
              )}
            >
              ℹ️ Fallback mechanism was used
            </div>
          )}

          {error.recoverable && onRetry && (
            <div className="pt-2">
              <Button
                onClick={onRetry}
                size="sm"
                variant="outline"
                className={cn(
                  "text-xs",
                  "border-yellow-300 bg-yellow-100 hover:bg-yellow-200",
                  "dark:border-yellow-800 dark:bg-yellow-900/50 dark:hover:bg-yellow-900"
                )}
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const ErrorAlert = memo(PureErrorAlert);
