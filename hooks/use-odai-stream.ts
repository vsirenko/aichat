"use client";

import { useChat } from "@ai-sdk/react";
import { useCallback, useState } from "react";
import {
  initializePhases,
  isODAIAnnotation,
  type ModelExecutionState,
  type PhaseState,
  updateModelState,
  updatePhaseState,
} from "@/lib/ai/odai-stream-handler";
import type { ODAIStreamAnnotation } from "@/lib/ai/odai-types";

export interface UseODAIStreamOptions {
  onPhaseUpdate?: (phases: PhaseState[]) => void;
  onModelUpdate?: (models: ModelExecutionState[]) => void;
  onCostEstimate?: (cost: number) => void;
  onWebSearch?: (sources: Array<{ title: string; url: string }>) => void;
}

export interface ODAIStreamState {
  phases: PhaseState[];
  models: ModelExecutionState[];
  costEstimate?: number;
  webSources?: Array<{ title: string; url: string }>;
}

export function useODAIStream(options: UseODAIStreamOptions = {}) {
  const [odaiState, setODAIState] = useState<ODAIStreamState>({
    phases: initializePhases(),
    models: [],
  });

  const handleODAIData = useCallback(
    (dataPart: { type: string; data: unknown }) => {
      if (isODAIAnnotation(dataPart)) {
        const annotation = dataPart as ODAIStreamAnnotation;

        setODAIState((prev) => {
          const newState = { ...prev };

          newState.phases = updatePhaseState(prev.phases, annotation);

          newState.models = updateModelState(prev.models, annotation);

          if (annotation.type === "odai-cost.estimate") {
            newState.costEstimate = annotation.data.estimated_cost_usd;
            options.onCostEstimate?.(annotation.data.estimated_cost_usd);
          }

          if (
            annotation.type === "odai-web.search" &&
            annotation.data.sources
          ) {
            newState.webSources = annotation.data.sources;
            options.onWebSearch?.(annotation.data.sources);
          }

          return newState;
        });

        if (
          annotation.type === "odai-phase.start" ||
          annotation.type === "odai-phase.complete"
        ) {
          options.onPhaseUpdate?.(odaiState.phases);
        }

        if (
          annotation.type === "odai-model.active" ||
          annotation.type === "odai-model.complete"
        ) {
          options.onModelUpdate?.(odaiState.models);
        }
      }
    },
    [options, odaiState.phases]
  );

  const chat = useChat({
    onData: handleODAIData,
    onFinish: () => {
      setODAIState({
        phases: initializePhases(),
        models: [],
      });
    },
  });

  return {
    ...chat,
    odai: odaiState,
  };
}
