import { NextResponse } from "next/server";
import { z } from "zod";
import { revokeToken } from "@/lib/ai/odai-auth";

const revokeSchema = z.object({
  session_token: z.string().min(1, "Session token is required"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = revokeSchema.parse(json);

    await revokeToken(body.session_token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Token revocation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }

    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? (error.statusCode as number)
        : 500;

    const message =
      error instanceof Error ? error.message : "Failed to revoke token";

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}


