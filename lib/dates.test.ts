import { describe, expect, it } from "vitest";
import { toDateInputValue } from "./dates";

describe("toDateInputValue", () => {
  it("preserves an existing ISO calendar date without a timezone shift", () => {
    expect(toDateInputValue("2026-06-28T23:00:00-07:00")).toBe("2026-06-28");
  });

  it("formats a readable date for a native date input", () => {
    expect(toDateInputValue("June 28, 2026")).toBe("2026-06-28");
  });

  it("does not throw for an invalid value", () => {
    expect(toDateInputValue("not a date")).toBe("not a date");
  });
});
