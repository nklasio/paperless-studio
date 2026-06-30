import type { CustomFieldDefinition, CustomFieldValue } from "@/lib/types";

export function customFieldValueIsValid(
  definition: CustomFieldDefinition,
  value: CustomFieldValue,
) {
  if (value === null) return true;
  const type = definition.dataType;
  if (type === "boolean") return typeof value === "boolean";
  if (type === "integer") {
    return (
      typeof value === "number" &&
      Number.isInteger(value) &&
      value >= -2_147_483_648 &&
      value <= 2_147_483_647
    );
  }
  if (type === "float")
    return typeof value === "number" && Number.isFinite(value);
  if (type === "documentlink") {
    return (
      Array.isArray(value) &&
      new Set(value).size === value.length &&
      value.every((id) => Number.isInteger(id) && id > 0)
    );
  }
  if (typeof value !== "string") return false;
  if (type === "string") return value.length <= 128;
  if (type === "url") {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }
  if (type === "date") return !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (type === "monetary") {
    return !value || /^(?:[A-Z]{3})?-?\d+(?:\.\d{1,2})?$/.test(value);
  }
  if (type === "select") {
    return (
      !value ||
      Boolean(definition.options?.some((option) => option.id === value))
    );
  }
  return true;
}
