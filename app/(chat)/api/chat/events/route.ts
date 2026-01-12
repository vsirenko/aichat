import { getSessionEmitter, flushEventBuffer } from "@/lib/ai/providers";

export const maxDuration = 800;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  console.log("[Events API] GET request received");
  
  // Extract sessionId from URL
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  
  if (!sessionId) {
    console.error("[Events API] No sessionId provided");
    return new Response("Missing sessionId parameter", { status: 400 });
  }
  
  console.log("[Events API] Setting up SSE stream for session:", sessionId);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      console.log("[Events API] Stream started for session:", sessionId);
      
      // Send connected message first
      controller.enqueue(encoder.encode(`data: {"type":"connected"}\n\n`));
      console.log("[Events API] Connected message sent");
      
      const eventHandler = (event: { eventType: string; data: unknown }) => {
        try {
          console.log(`[Events API] Received event from EventEmitter: ${event.eventType} for session: ${sessionId}`);
          console.log(`[Events API] Event data:`, JSON.stringify(event.data).substring(0, 200));
          const data = JSON.stringify(event);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          console.log(`[Events API] Event sent to client: ${event.eventType}`);
        } catch (error) {
          console.error("[Events API] Failed to send ODAI event:", error);
        }
      };

      // Get session-specific emitter
      const emitter = getSessionEmitter(sessionId);
      
      // Register listener before flushing buffer
      emitter.on("odai-event", eventHandler);
      console.log("[Events API] Event listener registered for session:", sessionId, "listener count:", emitter.listenerCount("odai-event"));

      // Small delay to ensure connection is established
      await new Promise(resolve => setTimeout(resolve, 100));

      // Send buffered events immediately after registering listener
      const bufferedEvents = flushEventBuffer(sessionId);
      console.log(`[Events API] Flushing ${bufferedEvents.length} buffered events for session: ${sessionId}`);
      for (const event of bufferedEvents) {
        try {
          console.log(`[Events API] Sending buffered event: ${event.eventType}`, JSON.stringify(event.data).substring(0, 100));
          const data = JSON.stringify(event);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          console.log(`[Events API] Buffered event sent: ${event.eventType}`);
        } catch (error) {
          console.error("[Events API] Failed to send buffered event:", error, event);
        }
      }

      request.signal.addEventListener("abort", () => {
        console.log("[Events API] Client disconnected, cleaning up session:", sessionId);
        emitter.off("odai-event", eventHandler);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
