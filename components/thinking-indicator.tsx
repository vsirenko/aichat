"use client";

import { Brain, Loader2 } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";

interface ThinkingIndicatorProps {
  className?: string;
}

function PureThinkingIndicator({ className }: ThinkingIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 rounded-lg border border-blue-500/30 bg-blue-50/50 px-4 py-3 dark:bg-blue-950/20",
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <Loader2 className="-right-1 -top-1 absolute h-3 w-3 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-blue-900 text-sm dark:text-blue-100">
          Thinking deeply...
        </span>
        <span className="text-blue-700 text-xs dark:text-blue-300">
          Processing your request through the ODAI pipeline
        </span>
      </div>
    </div>
  );
}

export const ThinkingIndicator = memo(PureThinkingIndicator);

