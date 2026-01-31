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

  // Phase 1 web results
  phase1WebSources: WebSource[];
  phase1WebScrapedSources: WebScrapedSource[];
  handleWebSearchPhase1: (event: WebSearchEvent) => void;
  handleWebScrapePhase1: (event: WebScrapeEvent) => void;
  
  // Phase 4 web results (grouped by sub-task)
  phase4WebResults: Map<string, { sources: WebSource[]; scrapedSources: WebScrapedSource[] }>;
  handleWebSearchPhase4: (event: WebSearchEvent) => void;
  handleWebScrapePhase4: (event: WebScrapeEvent) => void;
  webRefreshDetails: WebContextRefreshDetails | null;
  setWebRefreshDetails: (details: WebContextRefreshDetails | null) => void;
  
  // Legacy (deprecated, kept for backward compatibility)
  webSources: WebSource[];
  setWebSources: (sources: WebSource[]) => void;
  handleWebSearch: (event: WebSearchEvent) => void;
  webScrapedSources: WebScrapedSource[];
  setWebScrapedSources: (sources: WebScrapedSource[]) => void;
  handleWebScrape: (event: WebScrapeEvent) => void;

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
  
  // Phase 1 web results (first event only)
  const [phase1WebSources, setPhase1WebSources] = useState<WebSource[]>([]);
  const [phase1WebScrapedSources, setPhase1WebScrapedSources] = useState<WebScrapedSource[]>([]);
  const [phase1WebReceived, setPhase1WebReceived] = useState(false);
  
  // Phase 4 web results (grouped by sub-task, first event per sub-task only)
  const [phase4WebResults, setPhase4WebResults] = useState<Map<string, { sources: WebSource[]; scrapedSources: WebScrapedSource[] }>>(new Map());
  const [phase4WebReceivedKeys, setPhase4WebReceivedKeys] = useState<Set<string>>(new Set());
  
  // Legacy state (for backward compatibility)
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

  // Phase 1 handlers (first event only)
  const handleWebSearchPhase1 = useCallback((event: WebSearchEvent) => {
    if (event.action === "completed" && event.sources && !phase1WebReceived) {
      console.log("[ODAI Context] Phase 1 Web Search - First event, storing results");
      setPhase1WebSources(event.sources);
      setPhase1WebReceived(true);
    } else if (phase1WebReceived) {
      console.log("[ODAI Context] Phase 1 Web Search - Ignoring subsequent event");
    }
  }, [phase1WebReceived]);

  const handleWebScrapePhase1 = useCallback((event: WebScrapeEvent) => {
    if (event.action === "completed" && event.sources && !phase1WebReceived) {
      console.log("[ODAI Context] Phase 1 Web Scrape - First event, storing results");
      setPhase1WebScrapedSources(event.sources.map(s => ({
        ...s,
        sub_links: event.sub_links_scraped
      })));
      setPhase1WebReceived(true);
    } else if (phase1WebReceived) {
      console.log("[ODAI Context] Phase 1 Web Scrape - Ignoring subsequent event");
    }
  }, [phase1WebReceived]);

  // Phase 4 handlers (first event per sub-task only)
  const handleWebSearchPhase4 = useCallback((event: WebSearchEvent) => {
    if (event.action === "completed" && event.sources) {
      const subTaskKey = event.sub_task_index !== null && event.sub_task_index !== undefined
        ? `${event.sub_task_index}-${event.sub_task_id || 'unknown'}`
        : 'single';
      
      if (!phase4WebReceivedKeys.has(subTaskKey)) {
        console.log(`[ODAI Context] Phase 4 Web Search - First event for sub-task ${subTaskKey}, storing results`);
        setPhase4WebResults(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(subTaskKey) || { sources: [], scrapedSources: [] };
          newMap.set(subTaskKey, { ...existing, sources: event.sources || [] });
          return newMap;
        });
        setPhase4WebReceivedKeys(prev => new Set(prev).add(subTaskKey));
      } else {
        console.log(`[ODAI Context] Phase 4 Web Search - Ignoring subsequent event for sub-task ${subTaskKey}`);
      }
    }
  }, [phase4WebReceivedKeys]);

  const handleWebScrapePhase4 = useCallback((event: WebScrapeEvent) => {
    if (event.action === "completed" && event.sources) {
      const subTaskKey = event.sub_task_index !== null && event.sub_task_index !== undefined
        ? `${event.sub_task_index}-${event.sub_task_id || 'unknown'}`
        : 'single';
      
      if (!phase4WebReceivedKeys.has(subTaskKey)) {
        console.log(`[ODAI Context] Phase 4 Web Scrape - First event for sub-task ${subTaskKey}, storing results`);
        const scrapedSources = event.sources.map(s => ({
          ...s,
          sub_links: event.sub_links_scraped
        }));
        setPhase4WebResults(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(subTaskKey) || { sources: [], scrapedSources: [] };
          newMap.set(subTaskKey, { ...existing, scrapedSources });
          return newMap;
        });
        setPhase4WebReceivedKeys(prev => new Set(prev).add(subTaskKey));
      } else {
        console.log(`[ODAI Context] Phase 4 Web Scrape - Ignoring subsequent event for sub-task ${subTaskKey}`);
      }
    }
  }, [phase4WebReceivedKeys]);

  // Legacy handlers (for backward compatibility)
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
    
    // Reset Phase 1 web results
    setPhase1WebSources([]);
    setPhase1WebScrapedSources([]);
    setPhase1WebReceived(false);
    
    // Reset Phase 4 web results
    setPhase4WebResults(new Map());
    setPhase4WebReceivedKeys(new Set());
    
    // Reset legacy web results
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
      
      // Phase 1 web results
      phase1WebSources,
      phase1WebScrapedSources,
      handleWebSearchPhase1,
      handleWebScrapePhase1,
      
      // Phase 4 web results
      phase4WebResults,
      handleWebSearchPhase4,
      handleWebScrapePhase4,
      webRefreshDetails,
      setWebRefreshDetails,
      
      // Legacy web results
      webSources,
      setWebSources,
      handleWebSearch,
      webScrapedSources,
      setWebScrapedSources,
      handleWebScrape,
      
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
      
      // Phase 1 web results
      phase1WebSources,
      phase1WebScrapedSources,
      handleWebSearchPhase1,
      handleWebScrapePhase1,
      
      // Phase 4 web results
      phase4WebResults,
      handleWebSearchPhase4,
      handleWebScrapePhase4,
      webRefreshDetails,
      
      // Legacy web results
      webSources,
      handleWebSearch,
      webScrapedSources,
      handleWebScrape,
      
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
