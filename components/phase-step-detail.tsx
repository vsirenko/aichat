"use client";

import { ChevronDown } from "lucide-react";
import { memo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

interface PhaseStepDetailProps {
  stepName: string;
  stepStatus?: string;
  details?: Record<string, unknown>;
  className?: string;
}

function PurePhaseStepDetail({
  stepName,
  stepStatus,
  details,
  className,
}: PhaseStepDetailProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasDetails = details && Object.keys(details).length > 0;

  return (
    <Collapsible
      className={cn(
        "rounded-lg border bg-background/95 shadow-sm backdrop-blur-sm",
        className
      )}
      onOpenChange={setIsOpen}
      open={isOpen}
    >
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/50",
          !hasDetails && "cursor-default"
        )}
        disabled={!hasDetails}
      >
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-sm">{stepName}</span>
          {stepStatus && (
            <span className="text-muted-foreground text-xs capitalize">
              {stepStatus.replace(/_/g, " ")}
            </span>
          )}
        </div>
        {hasDetails && (
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        )}
      </CollapsibleTrigger>

      {hasDetails && (
        <CollapsibleContent className="border-t px-3 py-2">
          <div className="space-y-2">
            {Object.entries(details).map(([key, value]) => (
              <div className="flex flex-col gap-1" key={key}>
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  {key.replace(/_/g, " ")}
                </span>
                <span className="font-mono text-xs">
                  {typeof value === "object" && value !== null
                    ? JSON.stringify(value, null, 2)
                    : String(value)}
                </span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

export const PhaseStepDetail = memo(PurePhaseStepDetail);

