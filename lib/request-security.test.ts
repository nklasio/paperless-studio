import { describe, expect, it } from "vitest";
import { isSameOriginRequest } from "./request-security";

function request(origin?: string) {
  const headers = new Headers();
  headers.set("host", "studio.example");
  if (origin) headers.set("origin", origin);
  return {
    headers,
    url: "https://studio.example/documents",
  };
}

describe("isSameOriginRequest", () => {
  it("accepts same-origin browser mutations", () => {
    expect(isSameOriginRequest(request("https://studio.example"))).toBe(true);
  });

  it("rejects cross-origin browser mutations", () => {
    expect(isSameOriginRequest(request("https://attacker.example"))).toBe(
      false,
    );
  });

  it("accepts non-browser requests without an Origin header", () => {
    expect(isSameOriginRequest(request())).toBe(true);
  });
});
