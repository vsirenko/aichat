/**
 * Formatting utilities for ODAI UI display values.
 * Implements standardized formatting rules for Review 2.0.
 */

/**
 * Format boolean values as "Yes" or "No" (capitalized).
 * 
 * @example
 * formatBoolean(true) // "Yes"
 * formatBoolean(false) // "No"
 */
export function formatBoolean(value: boolean | undefined | null): string {
  if (value === undefined || value === null) return "No";
  return value ? "Yes" : "No";
}

/**
 * Format status/decision values: capitalize and use past tense.
 * 
 * @example
 * formatStatus("allow") // "Allowed"
 * formatStatus("block") // "Blocked"
 * formatStatus("complete") // "Completed"
 */
export function formatStatus(value: string | undefined | null): string {
  if (!value) return "Unknown";
  
  const statusMap: Record<string, string> = {
    allow: "Allowed",
    block: "Blocked",
    complete: "Completed",
    completed: "Completed",
    success: "Success",
    failed: "Failed",
    pending: "Pending",
    running: "Running",
  };
  
  return statusMap[value.toLowerCase()] || value;
}

/**
 * Format execution mode values.
 * 
 * @example
 * formatExecutionMode("single") // "Single Mode"
 * formatExecutionMode("decomposed") // "Decomposed Mode"
 */
export function formatExecutionMode(value: string | undefined | null): string {
  if (!value) return "Unknown";
  
  const modeMap: Record<string, string> = {
    single: "Single Mode",
    decomposed: "Decomposed Mode",
  };
  
  return modeMap[value.toLowerCase()] || value;
}

/**
 * Format token numbers: add thousand separators, remove "tokens" suffix.
 * 
 * @example
 * formatTokens(11394) // "11,394"
 * formatTokens(2992) // "2,992"
 */
export function formatTokens(value: number | undefined | null): string {
  if (value === undefined || value === null) return "0";
  return value.toLocaleString("en-US");
}

/**
 * Format cost values: strip trailing zeros, keep 2-4 meaningful decimals.
 * 
 * @example
 * formatCost(0.001) // "$0.001"
 * formatCost(0.0010) // "$0.001"
 * formatCost(1.11) // "$1.11"
 * formatCost(0.0746) // "$0.0746"
 */
export function formatCost(value: number | undefined | null): string {
  if (value === undefined || value === null) return "$0.00";
  
  // For very small values, show up to 4 decimals
  if (value < 0.01) {
    // Remove trailing zeros
    return `$${value.toFixed(4).replace(/\.?0+$/, "")}`;
  }
  
  // For larger values, show 2 decimals and remove trailing zeros
  return `$${value.toFixed(2).replace(/\.?0+$/, "")}`;
}

/**
 * Format duration: always show 2 decimals for all values.
 * 
 * @example
 * formatDuration(630) // "0.63s"
 * formatDuration(17123) // "17.12s"
 * formatDuration(42920) // "42.92s"
 */
export function formatDuration(ms: number | undefined | null): string {
  if (ms === undefined || ms === null) return "0s";
  
  const seconds = ms / 1000;
  
  // Always show 2 decimals for all values
  return `${seconds.toFixed(2)}s`;
}

/**
 * Format provider names with proper capitalization.
 * 
 * @example
 * formatProvider("anthropic") // "Anthropic"
 * formatProvider("openai") // "OpenAI"
 * formatProvider("groq") // "Groq"
 */
export function formatProvider(provider: string | undefined | null): string {
  if (!provider) return "Unknown";
  
  const providerMap: Record<string, string> = {
    anthropic: "Anthropic",
    openai: "OpenAI",
    groq: "Groq",
    gemini: "Gemini",
    together: "Together AI",
    "together-ai": "Together AI",
    togetherai: "Together AI",
  };
  
  return providerMap[provider.toLowerCase()] || provider;
}

/**
 * Format domain names: capitalize and replace underscores with hyphens.
 * 
 * @example
 * formatDomain("math") // "Math"
 * formatDomain("multi_domain") // "Multi-Domain"
 * formatDomain("code") // "Code"
 */
export function formatDomain(domain: string | undefined | null): string {
  if (!domain) return "Unknown";
  
  // Replace underscores with hyphens
  const withHyphens = domain.replace(/_/g, "-");
  
  // Capitalize each word
  return withHyphens
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("-");
}

/**
 * Format LLM enhancement status as boolean.
 * 
 * @example
 * formatEnhancement("Applied") // "Yes"
 * formatEnhancement("not applied") // "No"
 */
export function formatEnhancement(value: string | boolean | undefined | null): string {
  if (typeof value === "boolean") {
    return formatBoolean(value);
  }
  
  if (!value) return "No";
  
  const lowerValue = value.toLowerCase();
  return lowerValue.includes("applied") || lowerValue === "yes" ? "Yes" : "No";
}

/**
 * Format wave execution display string.
 * 
 * @example
 * formatWaveExecution(1, 1, 1, 17100) // "Wave 1: 1/1 completed · 17.1s"
 */
export function formatWaveExecution(
  waveNumber: number,
  completed: number,
  total: number,
  durationMs?: number
): string {
  const base = `Wave ${waveNumber}: ${completed}/${total} completed`;
  
  if (durationMs !== undefined && durationMs > 0) {
    return `${base} · ${formatDuration(durationMs)}`;
  }
  
  return base;
}
