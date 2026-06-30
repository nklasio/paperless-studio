import { describe, expect, it } from "vitest";
import { paperlessDocumentUrl, studioDocumentPath } from "./paperless-links";

describe("paperlessDocumentUrl", () => {
  it("builds the current Paperless document-detail route", () => {
    expect(paperlessDocumentUrl("https://paperless.example", 42)).toBe(
      "https://paperless.example/documents/42",
    );
  });

  it("preserves a Paperless path prefix", () => {
    expect(paperlessDocumentUrl("https://example.com/paperless/", 42)).toBe(
      "https://example.com/paperless/documents/42",
    );
  });

  it("rejects unsafe and credential-bearing URLs", () => {
    expect(paperlessDocumentUrl("javascript:alert(1)", 42)).toBeUndefined();
    expect(
      paperlessDocumentUrl("https://user:secret@example.com", 42),
    ).toBeUndefined();
  });
});

describe("studioDocumentPath", () => {
  it("only builds paths for positive integer document IDs", () => {
    expect(studioDocumentPath(42)).toBe("/documents/42");
    expect(studioDocumentPath("javascript:alert(1)")).toBeUndefined();
    expect(studioDocumentPath(-1)).toBeUndefined();
  });
});
