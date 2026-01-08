import { NextResponse } from "next/server";
import { getSessionStatus } from "@/lib/ai/odai-auth";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const sessionToken = authHeader.slice(7);
    const status = await getSessionStatus(sessionToken);

    return NextResponse.json(status);
  } catch (error) {
    console.error("Session status check error:", error);

    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? (error.statusCode as number)
        : 500;

    const message =
      error instanceof Error ? error.message : "Failed to check session status";

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}


