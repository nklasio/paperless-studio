import { describe, expect, it } from "vitest";
import { readSavedViews, SAVED_VIEWS_KEY } from "@/lib/saved-views";

describe("saved views", () => {
  it("migrates legacy tag-only views", () => {
    const storage = {
      getItem(key: string) {
        if (key === SAVED_VIEWS_KEY) return null;
        if (key === "paperless-custom-views") {
          return JSON.stringify([{ id: "1", label: "Taxes", tag: "Tax" }]);
        }
        return null;
      },
    };
    expect(readSavedViews(storage)).toEqual([
      {
        id: "1",
        label: "Taxes",
        view: "all",
        filters: { tag: "Tax" },
      },
    ]);
  });
});
