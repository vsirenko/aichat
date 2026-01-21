import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type { ArtifactKind } from "@/components/artifact";
import type { createDocument } from "./ai/tools/create-document";
import type { getWeather } from "./ai/tools/get-weather";
import type { requestSuggestions } from "./ai/tools/request-suggestions";
import type { updateDocument } from "./ai/tools/update-document";
import type { Suggestion } from "./types-db";
import type { AppUsage } from "./usage";

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;

export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  usage: AppUsage;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};

export interface PhaseState {
  phase: string;
  phase_number: number;
  phase_name: string;
  status: "pending" | "running" | "completed" | "failed";
  duration_ms?: number;
  details?: Record<string, unknown>;
  summary?: Record<string, unknown>;
  progress_percent?: number;
  current_step?: string;
  current_step_name?: string;
  current_step_status?: string;
}

export interface ModelExecution {
  model_id: string;
  provider: string;
  sample_index: number;
  wave_number?: number;
  status: "pending" | "running" | "completed" | "failed";
  tokens_used?: number;
  thinking_tokens?: number;
  duration_ms?: number;
  error_message?: string;
}

export interface WebSource {
  title: string;
  url: string;
}

export interface WebScrapedSource {
  title: string;
  url: string;
  sub_links?: number;
}
