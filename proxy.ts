import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authenticationDecision, safeReturnPath } from "@/lib/auth";

const publicPaths = new Set([
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/icon.svg",
]);

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (publicPaths.has(pathname)) return NextResponse.next();

  const decision = await authenticationDecision(request);
  if (decision === "authorized" || decision === "disabled") {
    return NextResponse.next();
  }
  if (decision === "invalid") {
    return new NextResponse("Studio authentication is misconfigured.", {
      status: 503,
    });
  }
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "next",
    safeReturnPath(`${pathname}${request.nextUrl.search}`),
  );
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
