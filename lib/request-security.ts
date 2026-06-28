import type { NextRequest } from "next/server";

export function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  return origin === request.nextUrl.origin;
}
