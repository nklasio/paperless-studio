import type { NavView } from "@/lib/types";

export const SAVED_VIEWS_KEY = "paperless-studio:saved-views:v2";

export type SavedView = {
  id: string;
  label: string;
  view: NavView;
  filters: {
    correspondent?: string;
    documentType?: string;
    tag?: string;
  };
};

export function readSavedViews(storage: Pick<Storage, "getItem">): SavedView[] {
  const current = storage.getItem(SAVED_VIEWS_KEY);
  const legacy = storage.getItem("paperless-custom-views");
  try {
    if (current) {
      const parsed = JSON.parse(current);
      return Array.isArray(parsed) ? parsed : [];
    }
    if (!legacy) return [];
    const parsed = JSON.parse(legacy) as Array<{
      id: string;
      label: string;
      tag: string;
    }>;
    return parsed.map((view) => ({
      id: view.id,
      label: view.label,
      view: "all",
      filters: { tag: view.tag },
    }));
  } catch {
    return [];
  }
}
