"use client";

import { ChevronDownIcon, ExternalLinkIcon, GlobeIcon } from "lucide-react";
import { memo, useState } from "react";
import type { WebSource } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";

interface WebSourcesPanelProps {
  sources: WebSource[];
}

function PureWebSourcesPanel({ sources }: WebSourcesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (sources.length === 0) {
    return null;
  }

  const displaySources = isExpanded ? sources : sources.slice(0, 5);
  const hasMore = sources.length > 5;

  return (
    <div className="space-y-3">
      <ScrollArea className={isExpanded ? "h-[60vh]" : "h-auto"}>
        <div className="space-y-2 pr-3">
          {displaySources.map((source, index) => {
            const hostname = new URL(source.url).hostname.replace("www.", "");
            return (
              <a
                className="group flex items-start gap-2.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm transition-all hover:border-blue-500/40 hover:bg-blue-50/50 hover:shadow-sm dark:hover:bg-blue-950/20"
                href={source.url}
                key={index}
                rel="noopener noreferrer"
                target="_blank"
              >
                <img
                  alt=""
                  className="mt-0.5 size-4 shrink-0 rounded-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                  src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-sans font-medium text-foreground leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {source.title}
                  </span>
                  <span className="font-sans truncate text-muted-foreground text-xs">
                    {hostname}
                  </span>
                </div>
                <ExternalLinkIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            );
          })}
        </div>
      </ScrollArea>

      {hasMore && (
        <button
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/60 border-dashed py-2.5 font-sans font-medium text-muted-foreground text-sm transition-all hover:border-blue-500/50 hover:bg-muted/50 hover:text-foreground"
          onClick={() => setIsExpanded(!isExpanded)}
          type="button"
        >
          <ChevronDownIcon
            className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
          <span>
            {isExpanded
              ? "Show less"
              : `Show ${sources.length - 5} more sources`}
          </span>
        </button>
      )}
    </div>
  );
}

export const WebSourcesPanel = memo(PureWebSourcesPanel);
