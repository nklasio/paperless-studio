import { describe, expect, it } from "vitest";
import { errorFromUpstream } from "./api-errors";

describe("Paperless errors", () => {
  it.each([
    [401, "paperless_authentication_failed", false],
    [403, "permission_denied", false],
    [404, "not_found", false],
    [429, "rate_limited", true],
    [500, "upstream_unavailable", true],
  ] as const)("maps HTTP %s", (status, code, retryable) => {
    const error = errorFromUpstream(new Response(null, { status }), "Fallback");
    expect(error.code).toBe(code);
    expect(error.retryable).toBe(retryable);
  });

  it("preserves Retry-After for rate limits", () => {
    const error = errorFromUpstream(
      new Response(null, {
        status: 429,
        headers: { "Retry-After": "30" },
      }),
      "Fallback",
    );
    expect(error.retryAfter).toBe("30");
  });
});
