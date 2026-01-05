import { NextResponse } from "next/server";
import { z } from "zod";
import { ChatSDKError } from "@/lib/errors";

const budgetConfirmationSchema = z.object({
  confirmation_id: z.string(),
  action: z.enum(["continue", "reduce", "abort"]),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = budgetConfirmationSchema.parse(json);

    return NextResponse.json({
      success: true,
      confirmation_id: body.confirmation_id,
      action: body.action,
    });
  } catch (error) {
    console.error("Budget confirmation error:", error);

    if (error instanceof z.ZodError) {
      return new ChatSDKError("bad_request:api").toResponse();
    }

    return NextResponse.json(
      { error: "Failed to process budget confirmation" },
      { status: 500 }
    );
  }
}
