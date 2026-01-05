import type { SSEEvent } from "./odai-types";

export function parseSSEEvents(chunk: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const lines = chunk.split("\n");

  let currentEvent: Partial<SSEEvent> = {};

  for (const line of lines) {
    if (line.startsWith("event: ")) {
      currentEvent.type = line.slice(7).trim() as SSEEvent["type"];
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
      } catch (error) {
        console.warn("Failed to parse SSE data:", data, error);
      }

      currentEvent = {};
    } else if (line === "") {
      currentEvent = {};
    }
  }

  return events;
}

export function extractTextFromDelta(event: SSEEvent): string | null {
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

export function isCompleteEvent(event: SSEEvent): boolean {
  return event.type === "message.complete" || event.type === "done";
}

export function isErrorEvent(event: SSEEvent): boolean {
  return event.type === "error";
}

export function extractUsage(event: SSEEvent): {
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
