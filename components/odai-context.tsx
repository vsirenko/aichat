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
    phase: "budget_allocation",
    phase_number: 2,
    phase_name: "Budget Allocation",
    status: "pending",
  },
  {
    phase: "prompt_engineering",
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
    console.log(`[ODAI Context] handlePhaseStart called for phase: ${event.phase} (${event.phase_name})`);
    setPhases((prev) => {
      const currentPhaseIndex = prev.findIndex((p) => p.phase === event.phase);
      const currentPhase = prev[currentPhaseIndex];
      
      console.log(`[ODAI Context] Current phase state:`, {
        phase: currentPhase?.phase,
        status: currentPhase?.status,
        progress: currentPhase?.progress_percent,
      });
      
      const newPhases = prev.map((p, index) => {
        if (index < currentPhaseIndex && p.status === "pending") {
          console.log(`[ODAI Context] Auto-completing phase ${p.phase} (was pending before current phase)`);
          return { ...p, status: "completed" as const, progress_percent: 100 };
        }
        if (p.phase === event.phase) {
          console.log(`[ODAI Context] Starting phase ${event.phase}: ${currentPhase?.status} -> running`);
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
      
      return newPhases;
    });
  }, []);

  const handlePhaseProgress = useCallback((event: PhaseProgressEvent) => {
    console.log(`[ODAI Context] handlePhaseProgress for ${event.phase}: ${event.step_name} (${event.progress_percent}%)`);
    
    if (
      event.phase === "inference" &&
      event.step === "web_context_refresh" &&
      event.details
    ) {
      console.log(`[ODAI Context] Setting web refresh details:`, event.details);
      setWebRefreshDetails(event.details as unknown as WebContextRefreshDetails);
    }

    setPhases((prev) => {
      const phase = prev.find((p) => p.phase === event.phase);
      console.log(`[ODAI Context] Updating phase ${event.phase} progress: ${phase?.progress_percent}% -> ${event.progress_percent}%`);
      
        // FALLBACK: Если получили progress для фазы которая не running, запустим её
        if (phase && phase.status !== "running" && phase.status !== "completed") {
          console.warn(`[ODAI Context] Received progress for ${event.phase} but status is ${phase.status}, auto-starting phase`);
        }
      
      return prev.map((p) =>
        p.phase === event.phase
          ? {
              ...p,
              status: p.status === "pending" ? ("running" as const) : p.status, // Auto-start if pending
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
      );
    });
  }, []);

  const handlePhaseComplete = useCallback((event: PhaseCompleteEvent) => {
    console.log(`[ODAI Context] handlePhaseComplete for ${event.phase}: success=${event.success}, duration=${(event.duration_ms / 1000).toFixed(2)}s`);
    
    setPhases((prev) => {
      const currentPhaseIndex = prev.findIndex((p) => p.phase === event.phase);
      const currentPhase = prev[currentPhaseIndex];
      
      console.log(`[ODAI Context] Completing phase ${event.phase}: ${currentPhase?.status} -> ${event.success ? "completed" : "failed"}`);
      console.log(`[ODAI Context] Phase summary:`, event.summary);
      
      return prev.map((p, index) => {
        if (index < currentPhaseIndex && p.status === "pending") {
          console.log(`[ODAI Context] Auto-completing phase ${p.phase} (was pending before completed phase)`);
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
    
    // Immediately start phase 0 (safety check) to show user it's working
    setTimeout(() => {
      setPhases(prev => prev.map((p, idx) => 
        idx === 0 ? { ...p, status: "running" as const, progress_percent: 0 } : p
      ));
    }, 100);
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
