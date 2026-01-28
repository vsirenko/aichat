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
  CostSummaryEvent,
  ErrorEvent,
  ModelActiveEvent,
  ModelCompleteEvent,
  PhaseCompleteEvent,
  PhaseProgressEvent,
  PhaseStartEvent,
  WebContextRefreshDetails,
  WebScrapeEvent,
  WebSearchEvent,
} from "@/lib/ai/odai-types";
import type { ModelExecution, PhaseState, WebScrapedSource, WebSource } from "@/lib/types";
import { initializePhases } from "@/lib/ai/odai-stream-handler";

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
  webScrapedSources: WebScrapedSource[];
  setWebScrapedSources: (sources: WebScrapedSource[]) => void;
  handleWebScrape: (event: WebScrapeEvent) => void;
  webRefreshDetails: WebContextRefreshDetails | null;
  setWebRefreshDetails: (details: WebContextRefreshDetails | null) => void;

  costEstimate: CostEstimateEvent | null;
  setCostEstimate: (estimate: CostEstimateEvent | null) => void;
  phase2ExecutionMode: string | null;
  phase2SubTaskCount: number | null;
  costSummary: CostSummaryEvent | null;
  setCostSummary: (summary: CostSummaryEvent | null) => void;
  budgetConfirmation: BudgetConfirmationRequiredEvent | null;
  setBudgetConfirmation: (
    confirmation: BudgetConfirmationRequiredEvent | null
  ) => void;

  errorEvents: ErrorEvent[];
  addErrorEvent: (event: ErrorEvent) => void;

  reset: () => void;
}

const ODAIContext = createContext<ODAIContextValue | null>(null);

export function ODAIContextProvider({ children }: { children: ReactNode }) {
  const [phases, setPhases] = useState<PhaseState[]>(() => initializePhases());
  const [models, setModels] = useState<ModelExecution[]>([]);
  const [webSources, setWebSources] = useState<WebSource[]>([]);
  const [webScrapedSources, setWebScrapedSources] = useState<WebScrapedSource[]>([]);
  const [webRefreshDetails, setWebRefreshDetails] =
    useState<WebContextRefreshDetails | null>(null);
  const [costEstimate, setCostEstimate] = useState<CostEstimateEvent | null>(
    null
  );
  const [phase2ExecutionMode, setPhase2ExecutionMode] = useState<string | null>(null);
  const [phase2SubTaskCount, setPhase2SubTaskCount] = useState<number | null>(null);
  const [costSummary, setCostSummary] = useState<CostSummaryEvent | null>(null);
  const [budgetConfirmation, setBudgetConfirmation] =
    useState<BudgetConfirmationRequiredEvent | null>(null);
  const [errorEvents, setErrorEvents] = useState<ErrorEvent[]>([]);

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
            // Keep frontend phase_name, don't overwrite with backend
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
    
    // Extract Phase 2 decomposition info
    if (event.phase === "budget_allocation" && event.summary) {
      const decomposition = event.summary.decomposition as Record<string, unknown> | undefined;
      const executionMode = (decomposition?.execution_mode as string) ?? (event.summary.execution_mode as string);
      const subTaskCount = (decomposition?.sub_task_count as number) ?? (decomposition?.subtasks as number);
      
      if (executionMode) {
        setPhase2ExecutionMode(executionMode);
      }
      if (subTaskCount !== undefined) {
        setPhase2SubTaskCount(subTaskCount);
      }
    }
    
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
            summary: event.summary,
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

  const handleWebScrape = useCallback((event: WebScrapeEvent) => {
    if (event.action === "completed" && event.sources) {
      setWebScrapedSources(event.sources.map(s => ({
        ...s,
        sub_links: event.sub_links_scraped
      })));
    }
  }, []);

  const addErrorEvent = useCallback((event: ErrorEvent) => {
    setErrorEvents(prev => [...prev, event]);
  }, []);

  const reset = useCallback(() => {
    setPhases(initializePhases());
    setModels([]);
    setWebSources([]);
    setWebScrapedSources([]);
    setWebRefreshDetails(null);
    setCostEstimate(null);
    setPhase2ExecutionMode(null);
    setPhase2SubTaskCount(null);
    setCostSummary(null);
    setBudgetConfirmation(null);
    setErrorEvents([]);
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
      webScrapedSources,
      setWebScrapedSources,
      handleWebScrape,
      webRefreshDetails,
      setWebRefreshDetails,
      costEstimate,
      setCostEstimate,
      phase2ExecutionMode,
      phase2SubTaskCount,
      costSummary,
      setCostSummary,
      budgetConfirmation,
      setBudgetConfirmation,
      errorEvents,
      addErrorEvent,
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
      webScrapedSources,
      handleWebScrape,
      webRefreshDetails,
      costEstimate,
      phase2ExecutionMode,
      phase2SubTaskCount,
      costSummary,
      budgetConfirmation,
      errorEvents,
      addErrorEvent,
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
