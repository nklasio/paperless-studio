import { describe, expect, it } from "vitest";
import { parseWorkspaceUrl, workspaceHref } from "@/lib/workspace-url";

describe("workspace URL state", () => {
  it("parses valid state and rejects invalid values", () => {
    expect(
      parseWorkspaceUrl(
        "?view=review&q=tax&page=3&correspondent=ACME&type=Invoice&tag=Finance",
      ),
    ).toEqual({
      view: "review",
      query: "tax",
      page: 3,
      correspondent: "ACME",
      documentType: "Invoice",
      tag: "Finance",
    });
    expect(parseWorkspaceUrl("?view=nope&page=-2").view).toBe("recent");
    expect(parseWorkspaceUrl("?page=-2").page).toBe(1);
  });

  it("creates compact shareable document URLs", () => {
    expect(
      workspaceHref(42, {
        view: "all",
        query: "annual report",
        page: 2,
        correspondent: "",
        documentType: "",
        tag: "Work",
      }),
    ).toBe("/documents/42?view=all&q=annual+report&page=2&tag=Work");
  });
});
