/**
 * Utility functions for parsing ODAI phase summaries with backward compatibility.
 * These functions handle field renames and structural changes in phase summaries.
 */

/**
 * Extract URLs extracted count from extraction summary.
 * Handles both new (urls_extracted) and old (urls) field names.
 */
export function getUrlsExtracted(extraction: Record<string, unknown> | undefined): number {
  if (!extraction) return 0;
  return (extraction.urls_extracted as number) ?? (extraction.urls as number) ?? 0;
}

/**
 * Extract primary domain from domain summary.
 * Handles both new (primary_domain) and old (primary) field names.
 * Domains are now human-readable (e.g., "Code", "Math") instead of enum format.
 */
export function getPrimaryDomain(domain: Record<string, unknown> | undefined): string {
  if (!domain) return "unknown";
  return (domain.primary_domain as string) ?? (domain.primary as string) ?? "unknown";
}

/**
 * Extract secondary domains from domain summary.
 * Handles both new (secondary_domains) and old (secondary) field names.
 */
export function getSecondaryDomains(domain: Record<string, unknown> | undefined): string[] {
  if (!domain) return [];
  return (domain.secondary_domains as string[]) ?? (domain.secondary as string[]) ?? [];
}

/**
 * Extract domain confidence from domain summary.
 * Handles both new (domain_confidence) and old (confidence) field names.
 */
export function getDomainConfidence(domain: Record<string, unknown> | undefined): number {
  if (!domain) return 0;
  return (domain.domain_confidence as number) ?? (domain.confidence as number) ?? 0;
}

/**
 * Extract model list from Phase 2 summary.
 * Handles both new (decomposition.model_list) and old (model_roster) structures.
 */
export function getModelList(phase2Summary: Record<string, unknown> | undefined): string[] {
  if (!phase2Summary) return [];
  
  // New format: decomposition.model_list
  const decomposition = phase2Summary.decomposition as Record<string, unknown> | undefined;
  if (decomposition?.model_list) {
    return decomposition.model_list as string[];
  }
  
  // Old format: model_roster (array of objects with model_id)
  const modelRoster = phase2Summary.model_roster as Array<{ model_id: string }> | undefined;
  if (modelRoster) {
    return modelRoster.map((m) => m.model_id);
  }
  
  return [];
}

/**
 * Extract LLM call counts from phase summary.
 * Handles both new (metrics.successful_llm_calls) and old (successful_calls) field names.
 */
export function getLlmCallCounts(summary: Record<string, unknown> | undefined): {
  successful: number;
  failed: number;
} {
  if (!summary) return { successful: 0, failed: 0 };
  
  const metrics = summary.metrics as Record<string, unknown> | undefined;
  
  return {
    successful: 
      (metrics?.successful_llm_calls as number) ?? 
      (summary.successful_llm_calls as number) ?? 
      (summary.successful_calls as number) ?? 
      0,
    failed: 
      (metrics?.failed_llm_calls as number) ?? 
      (summary.failed_llm_calls as number) ?? 
      (summary.failed_calls as number) ?? 
      0,
  };
}

/**
 * Format domain string for display.
 * Domains are now human-readable, so no transformation needed.
 * This function exists for backward compatibility.
 */
export function formatDomain(domain: string): string {
  // Domain is now human-readable: "Code", "Math", "Science", etc.
  // No transformation needed
  return domain;
}

/**
 * Extract web context refresh details from Phase 4 summary.
 * Handles field name changes (refresh_time_ms -> refresh_duration_ms).
 */
export function getWebContextRefreshDetails(summary: Record<string, unknown> | undefined): {
  refreshExecuted: boolean;
  promptsRefreshed: number;
  promptsFailed: number;
  promptsSkipped: number;
  refreshDurationMs: number;
} {
  if (!summary) {
    return {
      refreshExecuted: false,
      promptsRefreshed: 0,
      promptsFailed: 0,
      promptsSkipped: 0,
      refreshDurationMs: 0,
    };
  }
  
  const webRefresh = summary.web_context_refresh as Record<string, unknown> | undefined;
  
  return {
    refreshExecuted: (webRefresh?.refresh_executed as boolean) ?? false,
    promptsRefreshed: (webRefresh?.prompts_refreshed as number) ?? 0,
    promptsFailed: (webRefresh?.prompts_failed as number) ?? 0,
    promptsSkipped: (webRefresh?.prompts_skipped as number) ?? 0,
    refreshDurationMs: 
      (webRefresh?.refresh_duration_ms as number) ?? 
      (webRefresh?.refresh_time_ms as number) ?? 
      0,
  };
}

/**
 * Extract metrics from phase summary.
 * All phases now include a standardized metrics block.
 */
export function getPhaseMetrics(summary: Record<string, unknown> | undefined): {
  totalLlmCalls: number;
  successfulLlmCalls: number;
  failedLlmCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalThinkingTokens: number;
  modelsUsed: string[];
  providersUsed: string[];
  totalCost: number;
} | null {
  if (!summary) return null;
  
  const metrics = summary.metrics as Record<string, unknown> | undefined;
  if (!metrics) return null;
  
  return {
    totalLlmCalls: (metrics.total_llm_calls as number) ?? 0,
    successfulLlmCalls: (metrics.successful_llm_calls as number) ?? 0,
    failedLlmCalls: (metrics.failed_llm_calls as number) ?? 0,
    totalInputTokens: (metrics.total_input_tokens as number) ?? 0,
    totalOutputTokens: (metrics.total_output_tokens as number) ?? 0,
    totalThinkingTokens: (metrics.total_thinking_tokens as number) ?? 0,
    modelsUsed: (metrics.models_used as string[]) ?? [],
    providersUsed: (metrics.providers_used as string[]) ?? [],
    totalCost: (metrics.total_cost_usd as number) ?? 0,
  };
}
