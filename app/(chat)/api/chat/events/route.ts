import { odaiEventEmitter, flushEventBuffer } from "@/lib/ai/providers";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  console.log("[Events API] GET request received, setting up SSE stream");
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      console.log("[Events API] Stream started, setting up event handler");
      
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

      odaiEventEmitter.on("odai-event", eventHandler);
      console.log("[Events API] Event listener registered");

      // Send buffered events immediately
      const bufferedEvents = flushEventBuffer();
      console.log(`[Events API] Sending ${bufferedEvents.length} buffered events`);
      for (const event of bufferedEvents) {
        try {
          const data = JSON.stringify(event);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          console.log(`[Events API] Buffered event sent: ${event.eventType}`);
        } catch (error) {
          console.error("[Events API] Failed to send buffered event:", error);
        }
      }

      request.signal.addEventListener("abort", () => {
        console.log("[Events API] Client disconnected, cleaning up");
        odaiEventEmitter.off("odai-event", eventHandler);
        controller.close();
      });

      controller.enqueue(encoder.encode(`data: {"type":"connected"}\n\n`));
      console.log("[Events API] Connected message sent");
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
