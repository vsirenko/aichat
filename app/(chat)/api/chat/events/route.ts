import { odaiEventEmitter, flushEventBuffer } from "@/lib/ai/providers";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  console.log("[Events API] GET request received, setting up SSE stream");
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      console.log("[Events API] Stream started, setting up event handler");
      
      // Send connected message first
      controller.enqueue(encoder.encode(`data: {"type":"connected"}\n\n`));
      console.log("[Events API] Connected message sent");
      
      const eventHandler = (event: { eventType: string; data: unknown }) => {
        try {
          console.log(`[Events API] Emitting event: ${event.eventType}`, event.data);
          const data = JSON.stringify(event);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          console.log("[Events API] Event sent successfully");
        } catch (error) {
          console.error("[Events API] Failed to send ODAI event:", error);
        }
      };

      // Register listener before flushing buffer
      odaiEventEmitter.on("odai-event", eventHandler);
      console.log("[Events API] Event listener registered, current listener count:", odaiEventEmitter.listenerCount("odai-event"));

      // Small delay to ensure connection is established
      await new Promise(resolve => setTimeout(resolve, 100));

      // Send buffered events immediately after registering listener
      const bufferedEvents = flushEventBuffer();
      console.log(`[Events API] Flushing ${bufferedEvents.length} buffered events`);
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
        console.log("[Events API] Client disconnected, cleaning up");
        odaiEventEmitter.off("odai-event", eventHandler);
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
