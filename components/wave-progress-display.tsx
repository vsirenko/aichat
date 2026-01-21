"use client";

import { memo, useMemo } from "react";
import type { ModelExecution } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WaveProgressDisplayProps {
  models: ModelExecution[];
}

interface WaveInfo {
  waveNumber: number;
  models: ModelExecution[];
  completed: number;
  total: number;
  avgDuration?: number;
}

function PureWaveProgressDisplay({ models }: WaveProgressDisplayProps) {
  const waves = useMemo(() => {
    const waveMap = new Map<number, ModelExecution[]>();

    for (const model of models) {
      const wave = model.wave_number ?? 1;
      if (!waveMap.has(wave)) {
        waveMap.set(wave, []);
      }
      waveMap.get(wave)?.push(model);
    }

    const waveInfo: WaveInfo[] = [];
    for (const [waveNumber, waveModels] of waveMap.entries()) {
      const completed = waveModels.filter(
        (m) => m.status === "completed" || m.status === "failed"
      ).length;
      const durations = waveModels
        .filter((m) => m.duration_ms)
        .map((m) => m.duration_ms!);
      const avgDuration =
        durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : undefined;

      waveInfo.push({
        waveNumber,
        models: waveModels,
        completed,
        total: waveModels.length,
        avgDuration,
      });
    }

    return waveInfo.sort((a, b) => a.waveNumber - b.waveNumber);
  }, [models]);

  if (waves.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="font-medium text-muted-foreground text-sm">
        Wave Execution
      </div>
      {waves.map((wave) => {
        const progressPercent = (wave.completed / wave.total) * 100;
        const isComplete = wave.completed === wave.total;
        const hasRunning = wave.models.some((m) => m.status === "running");

        return (
          <div className="space-y-2" key={wave.waveNumber}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  Wave {wave.waveNumber}:
                </span>
                <span
                  className={cn(
                    "font-medium text-xs",
                    isComplete && "text-[#74885C] dark:text-[#D6FFA6]",
                    hasRunning && "text-[#3B43FE] dark:text-[#989CF9]",
                    !isComplete && !hasRunning && "text-muted-foreground"
                  )}
                >
                  {wave.completed}/{wave.total} complete
                </span>
              </div>
              {wave.avgDuration !== undefined && (
                <span className="font-medium text-muted-foreground text-xs">
                  ({(wave.avgDuration / 1000).toFixed(1)}s)
                </span>
              )}
            </div>

            {}
            <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-muted/30">
              {wave.models.map((model, i) => (
                <div
                  className={cn(
                    "flex-1 transition-all duration-500",
                    model.status === "completed" &&
                      "bg-[#74885C] dark:bg-[#D6FFA6]",
                    model.status === "running" &&
                      "animate-pulse bg-[#3B43FE] dark:bg-[#989CF9]",
                    model.status === "failed" && "bg-red-600 dark:bg-red-500",
                    model.status === "pending" && "bg-transparent"
                  )}
                  key={`${model.model_id}-${i}`}
                  title={`${model.model_id} (${model.provider}) - ${model.status}${model.duration_ms ? ` - ${(model.duration_ms / 1000).toFixed(1)}s` : ""}`}
                />
              ))}
            </div>

            {}
            {hasRunning && (
              <div className="text-muted-foreground text-xs">
                Running:{" "}
                {wave.models
                  .filter((m) => m.status === "running")
                  .map((m) => m.model_id)
                  .join(", ")}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const WaveProgressDisplay = memo(PureWaveProgressDisplay);
