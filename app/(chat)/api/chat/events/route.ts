import { odaiEventEmitter } from "@/lib/ai/providers";

export const maxDuration = 60;

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const eventHandler = (event: { eventType: string; data: unknown }) => {
        try {
          const data = JSON.stringify(event);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (error) {
          console.error("Failed to send ODAI event:", error);
        }
      };

      odaiEventEmitter.on("odai-event", eventHandler);

      request.signal.addEventListener("abort", () => {
        odaiEventEmitter.off("odai-event", eventHandler);
        controller.close();
      });

      controller.enqueue(encoder.encode(`data: {"type":"connected"}\n\n`));
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
