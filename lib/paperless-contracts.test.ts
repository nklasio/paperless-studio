import { describe, expect, it } from "vitest";
import {
  customFieldDefinitionSchema,
  paperlessDocumentSchema,
  taskSchema,
} from "@/lib/paperless-contracts";

describe("Paperless contracts", () => {
  it("accepts API v9 custom fields and defaults optional capabilities", () => {
    expect(
      paperlessDocumentSchema.parse({
        id: 1,
        title: "Document",
        correspondent: null,
        document_type: null,
        tags: [],
        created: "2026-06-30",
        added: "2026-06-30T10:00:00Z",
      }).user_can_change,
    ).toBe(true);
    expect(
      customFieldDefinitionSchema.parse({
        id: 2,
        name: "Amount",
        data_type: "monetary",
        extra_data: { default_currency: "EUR" },
      }).extra_data?.default_currency,
    ).toBe("EUR");
  });

  it("rejects malformed document and task responses", () => {
    expect(() => paperlessDocumentSchema.parse({ id: "1" })).toThrow();
    expect(() => taskSchema.parse({ task_id: 3 })).toThrow();
  });
});
