"use client";

import { useCallback, useEffect, useState } from "react";
import type { ModelExecution, PhaseState, WebSource } from "@/lib/types";
import type { WebContextRefreshDetails } from "@/lib/ai/odai-types";

export interface HistoryEntry {
  id: string;
  timestamp: number;
  phases: PhaseState[];
  models: ModelExecution[];
  webSources: WebSource[];
  webRefreshDetails: WebContextRefreshDetails | null;
  userQuery?: string;
}

const HISTORY_KEY = "odai_thinking_history";

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as HistoryEntry[];
        setHistory(parsed);
      }
    } catch (error) {
      console.error("Failed to load history from localStorage:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever history changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      } catch (error) {
        console.error("Failed to save history to localStorage:", error);
      }
    }
  }, [history, isLoaded]);

  // Clear history on page unload (beforeunload event)
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        localStorage.removeItem(HISTORY_KEY);
      } catch (error) {
        console.error("Failed to clear history on unload:", error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const addHistoryEntry = useCallback(
    (entry: Omit<HistoryEntry, "id" | "timestamp">) => {
      const newEntry: HistoryEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };
      setHistory((prev) => [newEntry, ...prev]);
    },
    []
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  }, []);

  const removeEntry = useCallback((id: string) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  return {
    history,
    addHistoryEntry,
    clearHistory,
    removeEntry,
  };
}
