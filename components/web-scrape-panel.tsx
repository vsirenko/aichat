"use client";

import { ExternalLinkIcon } from "lucide-react";
import { memo, useState } from "react";
import type { WebScrapedSource } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WebScrapePanelProps {
  sources: WebScrapedSource[];
}

function PureWebScrapePanel({ sources }: WebScrapePanelProps) {
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
                className="group flex items-start gap-2.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm transition-all hover:border-purple-500/40 hover:bg-purple-50/50 hover:shadow-sm dark:hover:bg-purple-950/20"
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
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-medium text-foreground leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400">
                      {source.title}
                    </span>
                    {source.sub_links !== undefined && source.sub_links > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        +{source.sub_links} links
                      </Badge>
                    )}
                  </div>
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
          className="w-full rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50"
          onClick={() => setIsExpanded(!isExpanded)}
          type="button"
        >
          {isExpanded
            ? "Show Less"
            : `Show All (${sources.length - 5} more)`}
        </button>
      )}
    </div>
  );
}

export const WebScrapePanel = memo(PureWebScrapePanel);
