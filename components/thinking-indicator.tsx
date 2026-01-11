"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

interface ThinkingIndicatorProps {
  className?: string;
}

// Animated ODAI logo spinner
function ODAISpinner() {
  return (
    <div className="relative h-8 w-8">
      <svg
        className="h-full w-full"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer circle (spinning) */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#3B43FE"
          strokeWidth="3"
          strokeDasharray="283"
          strokeDashoffset="0"
          className="animate-spin origin-center"
          style={{ animationDuration: "2s" }}
        />
        
        {/* Inner filling circle (pulsing) */}
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="#D6FFA6"
          opacity="0.3"
          className="animate-pulse"
        />
        
        {/* Center dot */}
        <circle
          cx="50"
          cy="50"
          r="8"
          fill="#3B43FE"
          className="animate-pulse"
        />
        
        {/* Rotating segments */}
        <g className="animate-spin origin-center" style={{ animationDuration: "1.5s", animationDirection: "reverse" }}>
          <path
            d="M 50 5 A 45 45 0 0 1 95 50"
            fill="none"
            stroke="#D6FFA6"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 50 95 A 45 45 0 0 1 5 50"
            fill="none"
            stroke="#D6FFA6"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}

function PureThinkingIndicator({ className }: ThinkingIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 rounded-lg border px-4 py-3",
        className
      )}
      style={{ 
        borderColor: "#3B43FE33",
        background: "linear-gradient(135deg, #D6FFA610 0%, #3B43FE10 100%)"
      }}
    >
      <ODAISpinner />
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1 font-semibold text-sm" style={{ color: "#3B43FE" }}>
          <span>Thinking</span>
          <span className="animate-pulse">.</span>
          <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>.</span>
          <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>.</span>
        </div>
        <span className="text-xs" style={{ color: "#74885C" }}>
          Processing your request through the ODAI pipeline
        </span>
      </div>
    </div>
  );
}

export const ThinkingIndicator = memo(PureThinkingIndicator);

