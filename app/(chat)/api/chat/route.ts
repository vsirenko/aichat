import { convertToModelMessages, streamText } from "ai";
import {
  AuthenticationError,
  setSessionCache,
  validateODAIConfig,
} from "@/lib/ai/odai-auth";
import { odai } from "@/lib/ai/providers";
import { ChatSDKError } from "@/lib/errors";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

export const odaiEventsStore = new Map<
  string,
  Array<{ eventType: string; data: unknown }>
>();

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (error) {
    console.error("Invalid request body:", error);
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const authHeader = request.headers.get("Authorization");
    
    if (authHeader?.startsWith("Bearer ")) {
      const sessionToken = authHeader.slice(7);
      setSessionCache({
        sessionToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        quotaRemaining: 50,
        quotaLimit: 50,
      });
    } else if (!process.env.ODAI_ACCESS_TOKEN) {
      throw new AuthenticationError("No session token provided", 401);
    }

    validateODAIConfig();

    const {
      messages,
      selectedChatModel,
      include_phase_events = true,
      skip_safety_check = false,
      skip_llm_enhancement = false,
      skip_llm_judge = false,
      max_samples_per_model = 3,
    } = requestBody;

    const model =
      selectedChatModel === "odai-frontier" ? odai.frontier() : odai.fast();

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

    return result.toUIMessageStreamResponse();
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof AuthenticationError) {
      return new ChatSDKError("unauthorized:auth", error.message).toResponse();
    }

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatSDKError("offline:chat").toResponse();
  }
}
