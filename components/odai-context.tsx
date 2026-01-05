"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type {
  BudgetConfirmationRequiredEvent,
  CostEstimateEvent,
  ModelActiveEvent,
  ModelCompleteEvent,
  PhaseCompleteEvent,
  PhaseProgressEvent,
  PhaseStartEvent,
  WebContextRefreshDetails,
  WebSearchEvent,
} from "@/lib/ai/odai-types";
import type { ModelExecution, PhaseState, WebSource } from "@/lib/types";

interface ODAIContextValue {
  phases: PhaseState[];
  updatePhase: (phase: string, update: Partial<PhaseState>) => void;
  handlePhaseStart: (event: PhaseStartEvent) => void;
  handlePhaseProgress: (event: PhaseProgressEvent) => void;
  handlePhaseComplete: (event: PhaseCompleteEvent) => void;

  models: ModelExecution[];
  addModel: (event: ModelActiveEvent) => void;
  updateModel: (
    modelId: string,
    sampleIndex: number,
    update: Partial<ModelExecution>
  ) => void;
  handleModelActive: (event: ModelActiveEvent) => void;
  handleModelComplete: (event: ModelCompleteEvent) => void;

  webSources: WebSource[];
  setWebSources: (sources: WebSource[]) => void;
  handleWebSearch: (event: WebSearchEvent) => void;
  webRefreshDetails: WebContextRefreshDetails | null;
  setWebRefreshDetails: (details: WebContextRefreshDetails | null) => void;

  costEstimate: CostEstimateEvent | null;
  setCostEstimate: (estimate: CostEstimateEvent | null) => void;
  budgetConfirmation: BudgetConfirmationRequiredEvent | null;
  setBudgetConfirmation: (
    confirmation: BudgetConfirmationRequiredEvent | null
  ) => void;

  reset: () => void;
}

const ODAIContext = createContext<ODAIContextValue | null>(null);

const INITIAL_PHASES: PhaseState[] = [
  {
    phase: "safety",
    phase_number: 0,
    phase_name: "Safety Check",
    status: "pending",
  },
  {
    phase: "pre_analysis",
    phase_number: 1,
    phase_name: "Pre-Analysis",
    status: "pending",
  },
  {
    phase: "budget",
    phase_number: 2,
    phase_name: "Budget Allocation",
    status: "pending",
  },
  {
    phase: "prompts",
    phase_number: 3,
    phase_name: "Prompt Engineering",
    status: "pending",
  },
  {
    phase: "inference",
    phase_number: 4,
    phase_name: "Multi-Model Inference",
    status: "pending",
  },
  {
    phase: "selection",
    phase_number: 5,
    phase_name: "Response Selection",
    status: "pending",
  },
];

export function ODAIContextProvider({ children }: { children: ReactNode }) {
  const [phases, setPhases] = useState<PhaseState[]>(INITIAL_PHASES);
  const [models, setModels] = useState<ModelExecution[]>([]);
  const [webSources, setWebSources] = useState<WebSource[]>([]);
  const [webRefreshDetails, setWebRefreshDetails] =
    useState<WebContextRefreshDetails | null>(null);
  const [costEstimate, setCostEstimate] = useState<CostEstimateEvent | null>(
    null
  );
  const [budgetConfirmation, setBudgetConfirmation] =
    useState<BudgetConfirmationRequiredEvent | null>(null);

  const updatePhase = useCallback(
    (phase: string, update: Partial<PhaseState>) => {
      setPhases((prev) =>
        prev.map((p) => (p.phase === phase ? { ...p, ...update } : p))
      );
    },
    []
  );

  const handlePhaseStart = useCallback((event: PhaseStartEvent) => {
    setPhases((prev) => {
      const currentPhaseIndex = prev.findIndex((p) => p.phase === event.phase);
      return prev.map((p, index) => {
        if (index < currentPhaseIndex && p.status === "pending") {
          return { ...p, status: "completed" as const, progress_percent: 100 };
        }
        if (p.phase === event.phase) {
          return {
            ...p,
            status: "running" as const,
            phase_name: event.phase_name,
            phase_number: event.phase_number,
            progress_percent: 0,
            current_step: undefined,
            current_step_name: undefined,
            current_step_status: undefined,
          };
        }
        return p;
      });
    });
  }, []);

  const handlePhaseProgress = useCallback((event: PhaseProgressEvent) => {
    if (
      event.phase === "inference" &&
      event.step === "web_context_refresh" &&
      event.details
    ) {
      setWebRefreshDetails(event.details as WebContextRefreshDetails);
    }

    setPhases((prev) =>
      prev.map((p) =>
        p.phase === event.phase
          ? {
              ...p,
              progress_percent: event.progress_percent,
              current_step: event.step,
              current_step_name: event.step_name,
              current_step_status: event.status,
              details: {
                ...p.details,
                [event.step]: event.details,
              },
            }
          : p
      )
    );
  }, []);

  const handlePhaseComplete = useCallback((event: PhaseCompleteEvent) => {
    setPhases((prev) => {
      const currentPhaseIndex = prev.findIndex((p) => p.phase === event.phase);
      return prev.map((p, index) => {
        if (index < currentPhaseIndex && p.status === "pending") {
          return { ...p, status: "completed" as const, progress_percent: 100 };
        }
        if (p.phase === event.phase) {
          return {
            ...p,
            status: event.success
              ? ("completed" as const)
              : ("failed" as const),
            progress_percent: 100,
            duration_ms: event.duration_ms,
            details: event.summary,
            current_step: undefined,
            current_step_name: undefined,
            current_step_status: undefined,
          };
        }
        return p;
      });
    });
  }, []);

  const addModel = useCallback((event: ModelActiveEvent) => {
    setModels((prev) => [
      ...prev,
      {
        model_id: event.model_id,
        provider: event.provider,
        sample_index: event.sample_index,
        wave_number: event.wave_number,
        status: "running",
      },
    ]);
  }, []);

  const updateModel = useCallback(
    (modelId: string, sampleIndex: number, update: Partial<ModelExecution>) => {
      setModels((prev) =>
        prev.map((m) =>
          m.model_id === modelId && m.sample_index === sampleIndex
            ? { ...m, ...update }
            : m
        )
      );
    },
    []
  );

  const handleModelActive = useCallback(
    (event: ModelActiveEvent) => {
      addModel(event);
    },
    [addModel]
  );

  const handleModelComplete = useCallback(
    (event: ModelCompleteEvent) => {
      updateModel(event.model_id, event.sample_index, {
        status:
          event.status === "success"
            ? "completed"
            : event.status === "failed"
              ? "failed"
              : "failed",
        tokens_used: event.tokens_used,
        thinking_tokens: event.thinking_tokens,
        duration_ms: event.duration_ms,
        error_message: event.error_message,
      });
    },
    [updateModel]
  );

  const handleWebSearch = useCallback((event: WebSearchEvent) => {
    if (event.action === "completed" && event.sources) {
      setWebSources(event.sources);
    }
  }, []);

  const reset = useCallback(() => {
    setPhases(INITIAL_PHASES);
    setModels([]);
    setWebSources([]);
    setWebRefreshDetails(null);
    setCostEstimate(null);
    setBudgetConfirmation(null);
  }, []);

  const value = useMemo<ODAIContextValue>(
    () => ({
      phases,
      updatePhase,
      handlePhaseStart,
      handlePhaseProgress,
      handlePhaseComplete,
      models,
      addModel,
      updateModel,
      handleModelActive,
      handleModelComplete,
      webSources,
      setWebSources,
      handleWebSearch,
      webRefreshDetails,
      setWebRefreshDetails,
      costEstimate,
      setCostEstimate,
      budgetConfirmation,
      setBudgetConfirmation,
      reset,
    }),
    [
      phases,
      updatePhase,
      handlePhaseStart,
      handlePhaseProgress,
      handlePhaseComplete,
      models,
      addModel,
      updateModel,
      handleModelActive,
      handleModelComplete,
      webSources,
      handleWebSearch,
      webRefreshDetails,
      costEstimate,
      budgetConfirmation,
      reset,
    ]
  );

  return <ODAIContext.Provider value={value}>{children}</ODAIContext.Provider>;
}

export function useODAIContext() {
  const context = useContext(ODAIContext);
  if (!context) {
    throw new Error("useODAIContext must be used within ODAIContextProvider");
  }
  return context;
}
