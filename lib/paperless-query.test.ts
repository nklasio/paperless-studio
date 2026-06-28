import { describe, expect, it } from "vitest";
import {
  buildDocumentQuery,
  type PaperlessMetadataItem,
} from "./paperless-query";

const tags: PaperlessMetadataItem[] = [
  { id: 1, name: "Finanzen" },
  { id: 2, name: "Needs review" },
  { id: 3, name: "Taxes" },
  { id: 4, name: "Personal" },
];

describe("buildDocumentQuery", () => {
  it("applies saved views before Paperless pagination", () => {
    const { params, hasMatches } = buildDocumentQuery(
      { page: 2, pageSize: 20, view: "finance" },
      tags,
    );

    expect(hasMatches).toBe(true);
    expect(params.get("page")).toBe("2");
    expect(params.get("tags__id__in")).toBe("1");
    expect(params.get("ordering")).toBe("-added");
  });

  it("combines custom and metadata tag requirements", () => {
    const { params, hasMatches } = buildDocumentQuery(
      {
        page: 1,
        pageSize: 20,
        customTag: "Taxes",
        tag: "Personal",
        correspondent: "Acme & Sons",
        documentType: "Invoice",
      },
      tags,
    );

    expect(hasMatches).toBe(true);
    expect(params.get("tags__id__all")).toBe("3,4");
    expect(params.get("correspondent__name__iexact")).toBe("Acme & Sons");
    expect(params.get("document_type__name__iexact")).toBe("Invoice");
  });

  it("returns an empty result signal when a required tag does not exist", () => {
    expect(
      buildDocumentQuery(
        { page: 1, pageSize: 20, view: "review" },
        tags.filter((tag) => tag.id !== 2),
      ).hasMatches,
    ).toBe(false);
  });

  it("uses the Paperless inbox flag", () => {
    const { params } = buildDocumentQuery(
      { page: 1, pageSize: 20, view: "inbox" },
      tags,
    );

    expect(params.get("is_in_inbox")).toBe("true");
  });

  it("keeps direct document lookups independent from active views", () => {
    const { params } = buildDocumentQuery(
      {
        page: 1,
        pageSize: 1,
        documentId: "42",
        view: "finance",
      },
      [],
    );

    expect(params.get("id__in")).toBe("42");
    expect(params.has("tags__id__in")).toBe(false);
  });
});
