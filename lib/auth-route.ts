import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authenticationDecision } from "@/lib/auth";

export async function requireDocumentAuthentication(request: NextRequest) {
  const decision = await authenticationDecision(request);
  if (decision === "authorized" || decision === "disabled") return null;
  if (decision === "invalid") {
    return NextResponse.json(
      { error: "Studio authentication is misconfigured" },
      { status: 503 },
    );
  }
  return NextResponse.json(
    { error: "Authentication required" },
    { status: 401 },
  );
}
