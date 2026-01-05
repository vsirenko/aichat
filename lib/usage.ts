import type { LanguageModelUsage } from "ai";
import type { UsageData } from "tokenlens/helpers";

export type AppUsage = LanguageModelUsage & UsageData & { modelId?: string };
