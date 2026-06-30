import type { NavView } from "@/lib/types";

const validViews = new Set<NavView>([
  "inbox",
  "recent",
  "review",
  "all",
  "finance",
  "personal",
  "work",
]);

export type WorkspaceUrlState = {
  view: NavView;
  query: string;
  page: number;
  correspondent: string;
  documentType: string;
  tag: string;
};

export function parseWorkspaceUrl(search: string): WorkspaceUrlState {
  const params = new URLSearchParams(search);
  const requestedView = params.get("view") as NavView | null;
  const parsedPage = Number(params.get("page"));
  return {
    view:
      requestedView && validViews.has(requestedView) ? requestedView : "recent",
    query: params.get("q") ?? "",
    page: Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    correspondent: params.get("correspondent") ?? "",
    documentType: params.get("type") ?? "",
    tag: params.get("tag") ?? "",
  };
}

export function workspaceHref(
  documentId: number | undefined,
  state: WorkspaceUrlState,
) {
  const params = new URLSearchParams();
  if (state.view !== "recent") params.set("view", state.view);
  if (state.query) params.set("q", state.query);
  if (state.page > 1) params.set("page", String(state.page));
  if (state.correspondent) params.set("correspondent", state.correspondent);
  if (state.documentType) params.set("type", state.documentType);
  if (state.tag) params.set("tag", state.tag);
  const query = params.toString();
  return `${documentId ? `/documents/${documentId}` : "/"}${query ? `?${query}` : ""}`;
}
