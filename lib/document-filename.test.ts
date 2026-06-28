import { describe, expect, it } from "vitest";
import { documentPdfFilename, inlinePdfDisposition } from "./document-filename";

describe("document PDF filenames", () => {
  it("uses the document title without duplicating its extension", () => {
    expect(documentPdfFilename("Annual statement.pdf", "42")).toBe(
      "Annual statement.pdf",
    );
  });

  it("removes filesystem and header-unsafe characters", () => {
    expect(documentPdfFilename('Invoice: "June" / final', "42")).toBe(
      "Invoice June final.pdf",
    );
  });

  it("falls back when the title is empty", () => {
    expect(documentPdfFilename("  ", "42")).toBe("document-42.pdf");
  });

  it("provides ASCII and UTF-8 Content-Disposition filenames", () => {
    expect(inlinePdfDisposition("München.pdf")).toBe(
      "inline; filename=\"M_nchen.pdf\"; filename*=UTF-8''M%C3%BCnchen.pdf",
    );
  });
});
