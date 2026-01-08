import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateWithAccessCode } from "@/lib/ai/odai-auth";

const accessCodeSchema = z.object({
  access_code: z.string().min(1, "Access code is required"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = accessCodeSchema.parse(json);

    const sessionData = await authenticateWithAccessCode(body.access_code);

    return NextResponse.json(sessionData);
  } catch (error) {
    console.error("Access code authentication error:", error);

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
      error instanceof Error ? error.message : "Authentication failed";

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}


