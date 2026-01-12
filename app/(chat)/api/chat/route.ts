import { convertToModelMessages, streamText } from "ai";
import {
  AuthenticationError,
  setSessionCache,
  validateODAIConfig,
} from "@/lib/ai/odai-auth";
import { odai, setCurrentSessionId } from "@/lib/ai/providers";
import { ChatSDKError } from "@/lib/errors";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 800;

export const odaiEventsStore = new Map<
  string,
  Array<{ eventType: string; data: unknown }>
>();

export async function POST(request: Request) {
  console.log("[Chat API] POST request received");
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    console.log("[Chat API] Request body:", json);
    requestBody = postRequestBodySchema.parse(json);
    console.log("[Chat API] Request body validated");
  } catch (error) {
    console.error("[Chat API] Invalid request body:", error);
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const authHeader = request.headers.get("Authorization");
    console.log("[Chat API] Auth header present:", !!authHeader);
    
    if (authHeader?.startsWith("Bearer ")) {
      const sessionToken = authHeader.slice(7);
      console.log("[Chat API] Session token found, setting cache");
      setSessionCache({
        sessionToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        quotaRemaining: 50,
        quotaLimit: 50,
      });
    } else if (!process.env.ODAI_ACCESS_TOKEN) {
      console.log("[Chat API] No auth token and no ODAI_ACCESS_TOKEN");
      throw new AuthenticationError("No session token provided", 401);
    } else {
      console.log("[Chat API] Using ODAI_ACCESS_TOKEN from env");
    }

    console.log("[Chat API] Validating ODAI config");
    validateODAIConfig();

    const {
      id,
      messages,
      selectedChatModel,
      include_phase_events = true,
      skip_safety_check = false,
      skip_llm_enhancement = false,
      skip_llm_judge = false,
      max_samples_per_model = 3,
    } = requestBody;

    const sessionId = id || crypto.randomUUID();
    console.log("[Chat API] Session ID:", sessionId);
    console.log("[Chat API] Model:", selectedChatModel);
    console.log("[Chat API] ODAI params:", {
      include_phase_events,
      skip_safety_check,
      skip_llm_enhancement,
      skip_llm_judge,
      max_samples_per_model,
    });
    console.log("[Chat API] Messages count:", messages.length);

    const model =
      selectedChatModel === "odai-frontier" ? odai.frontier() : odai.fast();

    console.log("[Chat API] Starting streamText...");
    console.log("[Chat API] Setting sessionId for provider:", sessionId);
    
    // Set sessionId globally before calling streamText
    setCurrentSessionId(sessionId);
    
    const result = streamText({
      model,
      messages: await convertToModelMessages(messages),
      experimental_providerMetadata: {
        odai: {
          include_phase_events,
          skip_safety_check,
          skip_llm_enhancement,
          skip_llm_judge,
          max_samples_per_model,
        },
      },
    } as Parameters<typeof streamText>[0]);

    console.log("[Chat API] Returning stream response");
    return result.toUIMessageStreamResponse();
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof AuthenticationError) {
      console.error("[Chat API] Authentication error:", error.message);
      return new ChatSDKError("unauthorized:auth", error.message).toResponse();
    }

    if (error instanceof ChatSDKError) {
      console.error("[Chat API] ChatSDKError:", error);
      return error.toResponse();
    }

    console.error("[Chat API] Unhandled error:", error, { vercelId });
    return new ChatSDKError("offline:chat").toResponse();
  }
}
