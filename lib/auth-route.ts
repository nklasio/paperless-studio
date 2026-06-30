import type { NextRequest } from "next/server";
import { authenticationDecision } from "@/lib/auth";
import { apiError } from "@/lib/api-errors";

export async function requireDocumentAuthentication(request: NextRequest) {
  const decision = await authenticationDecision(request);
  if (decision === "authorized" || decision === "disabled") return null;
  if (decision === "invalid") {
    return apiError(
      "not_configured",
      "Studio authentication is misconfigured.",
      503,
    );
  }
  return apiError("authentication_required", "Authentication required.", 401);
}
