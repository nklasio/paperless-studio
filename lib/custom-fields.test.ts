import { describe, expect, it } from "vitest";
import { customFieldValueIsValid } from "./custom-fields";
import type {
  CustomFieldDataType,
  CustomFieldDefinition,
  CustomFieldValue,
} from "./types";

function valid(dataType: CustomFieldDataType, value: CustomFieldValue) {
  const definition: CustomFieldDefinition = {
    id: 1,
    name: "Field",
    dataType,
    options: [{ id: "option", label: "Option" }],
  };
  return customFieldValueIsValid(definition, value);
}

describe("custom field values", () => {
  it.each([
    ["string", "Text"],
    ["longtext", "Long text"],
    ["url", "https://example.com"],
    ["date", "2026-06-30"],
    ["boolean", true],
    ["integer", 42],
    ["float", 4.2],
    ["monetary", "EUR123.45"],
    ["select", "option"],
    ["documentlink", [1, 2]],
  ] as Array<[CustomFieldDataType, CustomFieldValue]>)(
    "accepts valid %s values",
    (type, value) => expect(valid(type, value)).toBe(true),
  );

  it.each([
    ["string", "x".repeat(129)],
    ["url", "javascript:alert(1)"],
    ["date", "30.06.2026"],
    ["boolean", "yes"],
    ["integer", 4.2],
    ["float", Number.POSITIVE_INFINITY],
    ["monetary", "12.345"],
    ["select", "missing"],
    ["documentlink", [1, 1]],
  ] as Array<[CustomFieldDataType, CustomFieldValue]>)(
    "rejects invalid %s values",
    (type, value) => expect(valid(type, value)).toBe(false),
  );
});
