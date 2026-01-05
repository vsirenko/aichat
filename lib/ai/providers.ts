import { EventEmitter } from "node:events";
import type {
  LanguageModelV2,
  LanguageModelV2CallOptions,
  LanguageModelV2StreamPart,
  SharedV2ProviderMetadata,
} from "@ai-sdk/provider";
import { getSessionToken } from "./odai-auth";
import type {
  ChatCompletionRequest,
  ODAIEventType,
  ODAIMessage,
  SSEEvent,
} from "./odai-types";

const ODAI_API_BASE_URL =
  process.env.ODAI_API_BASE_URL || "http://45.63.92.192:52847";

const globalForODAI = globalThis as unknown as {
  odaiEventEmitter: EventEmitter | undefined;
};

export const odaiEventEmitter =
  globalForODAI.odaiEventEmitter ?? new EventEmitter();

if (process.env.NODE_ENV !== "production") {
  globalForODAI.odaiEventEmitter = odaiEventEmitter;
}

class ODAILanguageModel implements LanguageModelV2 {
  readonly specificationVersion = "v2" as const;
  readonly provider = "odai" as const;
  readonly modelId: string;
  readonly supportedUrls = {};

  constructor(modelId: "odai-frontier" | "odai-fast") {
    this.modelId = modelId;
  }

  async doGenerate(): Promise<never> {
    throw new Error(
      "doGenerate is not supported by ODAI provider. Use doStream instead."
    );
  }

  async doStream(options: LanguageModelV2CallOptions): Promise<{
    stream: ReadableStream<LanguageModelV2StreamPart>;
    warnings?: Array<{ type: string; message: string }>;
  }> {
    const sessionToken = await getSessionToken();

    const odaiParams =
      (options as { providerMetadata?: { odai?: Record<string, unknown> } })
        .providerMetadata?.odai || {};

    const messages: ODAIMessage[] = options.prompt
      .filter((msg) => msg.role !== "tool")
      .map((msg) => {
        let content = "";
        if (typeof msg.content === "string") {
          content = msg.content;
        } else if (Array.isArray(msg.content)) {
          content = msg.content
            .map((c) => {
              if (c.type === "text") return c.text;
              return "";
            })
            .join("\n");
        }

        return {
          role: msg.role as "user" | "assistant" | "system",
          content,
        };
      });

    const request: ChatCompletionRequest = {
      model: this.modelId as "odai-frontier" | "odai-fast",
      messages,
      stream: true,
      include_phase_events:
        (odaiParams.include_phase_events as boolean) ?? true,
      skip_safety_check: (odaiParams.skip_safety_check as boolean) ?? false,
      skip_llm_enhancement:
        (odaiParams.skip_llm_enhancement as boolean) ?? false,
      skip_llm_judge: (odaiParams.skip_llm_judge as boolean) ?? false,
      max_samples_per_model: (odaiParams.max_samples_per_model as number) ?? 3,
    };

    const response = await fetch(`${ODAI_API_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(request),
      signal: options.abortSignal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `ODAI API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const stream = this.createStreamTransformer(response.body!);

    return {
      stream,
    };
  }

  private createStreamTransformer(
    body: ReadableStream<Uint8Array>
  ): ReadableStream<LanguageModelV2StreamPart> {
    const decoder = new TextDecoder();
    let buffer = "";
    let inputTokens = 0;
    let outputTokens = 0;
    let hasStartedText = false;

    return new ReadableStream<LanguageModelV2StreamPart>({
      async start(controller) {
        const reader = body.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const events = parseSSEEvents(buffer);

            const lastNewlineIndex = buffer.lastIndexOf("\n\n");
            if (lastNewlineIndex !== -1) {
              buffer = buffer.slice(lastNewlineIndex + 2);
            }

            for (const event of events) {
              if (event.type === "message.delta") {
                const content = extractTextFromDelta(event);
                if (content) {
                  if (!hasStartedText) {
                    controller.enqueue({
                      type: "text-start",
                      id: "0",
                    });
                    hasStartedText = true;
                  }

                  controller.enqueue({
                    type: "text-delta",
                    id: "0",
                    delta: content,
                  });
                }
              }

              if (event.type === "message.complete") {
                const usage = extractUsage(event);
                if (usage) {
                  inputTokens = usage.promptTokens;
                  outputTokens = usage.completionTokens;
                }

                if (hasStartedText) {
                  controller.enqueue({
                    type: "text-end",
                    id: "0",
                  });
                }

                controller.enqueue({
                  type: "finish",
                  finishReason: "stop",
                  usage: {
                    inputTokens,
                    outputTokens,
                    totalTokens: inputTokens + outputTokens,
                  },
                });
              }

              if (event.type === "error") {
                const errorData = event.data as { message?: string };
                controller.enqueue({
                  type: "error",
                  error: errorData?.message || "Unknown ODAI error",
                });
              }

              if (isODAIPhaseEvent(event.type)) {
                const eventPayload = {
                  eventType: event.type,
                  data: event.data,
                };

                odaiEventEmitter.emit("odai-event", eventPayload);
              }
            }
          }
        } catch (error) {
          console.error("ODAI stream processing error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });
  }
}

function parseSSEEvents(chunk: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const lines = chunk.split("\n");

  let currentEvent: Partial<SSEEvent> = {};

  for (const line of lines) {
    if (line.startsWith("event: ")) {
      currentEvent.type = line.slice(7).trim() as ODAIEventType;
    } else if (line.startsWith("data: ")) {
      const data = line.slice(6);

      if (data === "[DONE]") {
        events.push({ type: "done", data: null });
        currentEvent = {};
        continue;
      }

      try {
        currentEvent.data = JSON.parse(data);
        if (currentEvent.type) {
          events.push(currentEvent as SSEEvent);
        }
      } catch {}

      currentEvent = {};
    }
  }

  return events;
}

function extractTextFromDelta(event: SSEEvent): string | null {
  if (event.type === "message.delta" && event.data) {
    const deltaEvent = event.data as {
      choices?: Array<{
        delta?: {
          content?: string;
        };
      }>;
    };
    return deltaEvent.choices?.[0]?.delta?.content ?? null;
  }
  return null;
}

function extractUsage(event: SSEEvent): {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  reasoningTokens?: number;
  totalCostUsd?: number;
} | null {
  if (event.type === "message.complete" && event.data) {
    const completeEvent = event.data as {
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        reasoning_tokens?: number;
      };
      usage_usd?: {
        total_cost_usd: number;
      };
    };

    if (completeEvent.usage) {
      return {
        promptTokens: completeEvent.usage.prompt_tokens,
        completionTokens: completeEvent.usage.completion_tokens,
        totalTokens: completeEvent.usage.total_tokens,
        reasoningTokens: completeEvent.usage.reasoning_tokens,
        totalCostUsd: completeEvent.usage_usd?.total_cost_usd,
      };
    }
  }
  return null;
}

function isODAIPhaseEvent(type: ODAIEventType): boolean {
  return [
    "phase.start",
    "phase.progress",
    "phase.complete",
    "model.active",
    "model.complete",
    "web.search",
    "cost.estimate",
    "budget.confirmation_required",
  ].includes(type);
}

export function createODAI(modelId: "odai-frontier" | "odai-fast") {
  return new ODAILanguageModel(modelId);
}

export const odai = {
  frontier: () => createODAI("odai-frontier"),
  fast: () => createODAI("odai-fast"),
  languageModel: (modelId: "odai-frontier" | "odai-fast") =>
    createODAI(modelId),
};

export const myProvider = {
  languageModel: (modelId: string) => {
    // For artifacts, use the frontier model by default
    if (modelId === "artifact-model") {
      return createODAI("odai-frontier");
    }
    // Fallback to frontier for any other model
    return createODAI("odai-frontier");
  },
};
