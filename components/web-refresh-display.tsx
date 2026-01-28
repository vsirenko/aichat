"use client";

import { SearchIcon } from "lucide-react";
import { memo } from "react";
import type { WebContextRefreshDetails } from "@/lib/ai/odai-types";
import { formatDuration } from "@/lib/formatters";

interface WebRefreshDisplayProps {
  details: WebContextRefreshDetails;
}

function PureWebRefreshDisplay({ details }: WebRefreshDisplayProps) {
  if (details.prompts_refreshed === 0) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center gap-2 font-semibold text-sm">
        <SearchIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span>DEEP Web Context Refresh</span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <div className="mb-1 text-muted-foreground text-xs">
            Prompts Refreshed
          </div>
          <div className="font-bold text-2xl">{details.prompts_refreshed}</div>
        </div>
        <div>
          <div className="mb-1 text-muted-foreground text-xs">
            Sources Found
          </div>
          <div className="font-bold text-2xl">
            {details.total_sources_found}
          </div>
        </div>
        <div>
          <div className="mb-1 text-muted-foreground text-xs">URLs Scraped</div>
          <div className="font-bold text-2xl">{details.total_urls_scraped}</div>
        </div>
        <div>
          <div className="mb-1 text-muted-foreground text-xs">Refresh Time</div>
          <div className="font-bold text-2xl">
            {formatDuration(details.refresh_duration_ms ?? details.refresh_time_ms ?? 0)}
          </div>
        </div>
      </div>

      <p className="text-muted-foreground text-xs italic">
        Fresh context injected before models
      </p>
    </div>
  );
}

export const WebRefreshDisplay = memo(PureWebRefreshDisplay);
