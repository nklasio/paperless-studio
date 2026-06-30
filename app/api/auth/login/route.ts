import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_SECONDS,
  authenticationState,
  createSessionToken,
} from "@/lib/auth";
import { authenticationProvider } from "@/lib/auth-provider";
import { isSameOriginRequest } from "@/lib/request-security";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local"
  );
}

function isRateLimited(key: string, now: number) {
  const attempt = attempts.get(key);
  if (!attempt || attempt.resetAt <= now) {
    attempts.delete(key);
    return false;
  }
  return attempt.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string, now: number) {
  if (attempts.size > 1_000) attempts.clear();
  const attempt = attempts.get(key);
  if (!attempt || attempt.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  attempt.count += 1;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Cross-origin requests are not allowed" },
      { status: 403 },
    );
  }

  const state = authenticationState();
  if (state.mode !== "configured") {
    return NextResponse.json(
      { error: "Studio authentication is not configured" },
      { status: 503 },
    );
  }

  const key = clientKey(request);
  const now = Date.now();
  if (isRateLimited(key, now)) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Try again later." },
      { status: 429, headers: { "Retry-After": "900" } },
    );
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid sign-in request" },
      { status: 400 },
    );
  }
  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";
  const provider = authenticationProvider(state);
  if (!provider || !(await provider.authenticate(username, password))) {
    recordFailure(key, now);
    return NextResponse.json(
      { error: "The username or password is incorrect." },
      { status: 401 },
    );
  }

  attempts.delete(key);
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: await createSessionToken(state.configuration, now),
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_SESSION_SECONDS,
  });
  return response;
}
