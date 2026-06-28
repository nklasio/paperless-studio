"use client";

import {
  Archive,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Command,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Grid2X2,
  Inbox,
  LayoutList,
  Maximize2,
  Menu,
  MoreHorizontal,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  RotateCw,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toDateInputValue } from "@/lib/dates";
import {
  availableTags,
  correspondents,
  documents as initialDocuments,
  documentTypes,
} from "@/lib/mock-data";
import type { NavView, PaperlessDocument } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  initialDocumentId?: number;
  authUsername?: string;
};

const PAGE_SIZE = 20;
type CustomView = { id: string; label: string; tag: string };

const viewLabels: Record<NavView, string> = {
  inbox: "Inbox",
  recent: "Recently added",
  review: "Needs review",
  all: "All documents",
  finance: "Finance",
  personal: "Personal",
  work: "Work",
};

const navItems: Array<{
  id: NavView;
  label: string;
  icon: typeof Inbox;
}> = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "recent", label: "Recently added", icon: Clock3 },
  { id: "review", label: "Needs review", icon: FileCheck2 },
  { id: "all", label: "All documents", icon: Archive },
];

const savedViews: Array<{
  id: NavView;
  label: string;
  color: string;
}> = [
  { id: "finance", label: "Finance", color: "var(--tag-blue)" },
  { id: "personal", label: "Personal", color: "var(--tag-sage)" },
  { id: "work", label: "Work", color: "var(--tag-plum)" },
];

export function DocumentWorkspace({ initialDocumentId, authUsername }: Props) {
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const previewStageRef = useRef<HTMLDivElement>(null);
  const paperWrapRef = useRef<HTMLDivElement>(null);
  const uploadCloseRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [documents, setDocuments] =
    useState<PaperlessDocument[]>(initialDocuments);
  const [selectedDocument, setSelectedDocument] = useState(
    initialDocuments.find((document) => document.id === initialDocumentId) ??
      initialDocuments[0],
  );
  const [activeView, setActiveView] = useState<NavView>("recent");
  const [activeCustomView, setActiveCustomView] = useState<string | null>(null);
  const [customViews, setCustomViews] = useState<CustomView[]>([]);
  const [newViewOpen, setNewViewOpen] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [newViewTag, setNewViewTag] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterCorrespondent, setFilterCorrespondent] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [helpOpen, setHelpOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [correspondentOptions, setCorrespondentOptions] =
    useState(correspondents);
  const [documentTypeOptions, setDocumentTypeOptions] = useState(documentTypes);
  const [tagOptions, setTagOptions] = useState(availableTags);
  const [selectedId, setSelectedId] = useState(
    initialDocumentId ?? initialDocuments[0].id,
  );
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    count: initialDocuments.length,
    page: 1,
    pageSize: PAGE_SIZE,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  });
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(
    initialDocumentId !== undefined,
  );
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [paperlessConnected, setPaperlessConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [previewPage, setPreviewPage] = useState(1);

  const selected =
    documents.find((document) => document.id === selectedId) ??
    selectedDocument;
  const activeCustomTag = customViews.find(
    (view) => view.id === activeCustomView,
  )?.tag;

  const visibleDocuments = useMemo(() => {
    if (paperlessConnected) return documents;

    const normalized = query.trim().toLowerCase();
    return documents.filter((document) => {
      const matchesQuery =
        !normalized ||
        [
          document.title,
          document.correspondent,
          document.documentType,
          ...document.tags,
        ].some((value) => value.toLowerCase().includes(normalized));

      const matchesView =
        activeView === "all" ||
        activeView === "recent" ||
        (activeView === "inbox" && document.status === "review") ||
        (activeView === "review" && document.status === "review") ||
        (activeView === "finance" &&
          document.tags.some((tag) => ["Finance", "Finanzen"].includes(tag))) ||
        (activeView === "personal" &&
          document.tags.some((tag) =>
            ["Personal", "Privatkunden"].includes(tag),
          )) ||
        (activeView === "work" &&
          document.tags.some((tag) =>
            ["Business", "Geschäftlich"].includes(tag),
          ));

      const customView = customViews.find(
        (view) => view.id === activeCustomView,
      );
      const matchesCustom =
        !customView || document.tags.includes(customView.tag);
      const matchesFilters =
        (!filterCorrespondent ||
          document.correspondent === filterCorrespondent) &&
        (!filterType || document.documentType === filterType) &&
        (!filterTag || document.tags.includes(filterTag));

      return matchesQuery && matchesView && matchesCustom && matchesFilters;
    });
  }, [
    activeCustomView,
    activeView,
    customViews,
    documents,
    filterCorrespondent,
    filterTag,
    filterType,
    paperlessConnected,
    query,
  ]);

  const selectedIndex = visibleDocuments.findIndex(
    (document) => document.id === selected.id,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [
    activeCustomView,
    activeView,
    filterCorrespondent,
    filterTag,
    filterType,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(PAGE_SIZE),
    });
    if (debouncedQuery) params.set("query", debouncedQuery);
    params.set("view", activeView);
    if (activeCustomTag) params.set("custom_tag", activeCustomTag);
    if (filterCorrespondent) {
      params.set("correspondent", filterCorrespondent);
    }
    if (filterType) params.set("document_type", filterType);
    if (filterTag) params.set("tag", filterTag);

    setLoadingDocuments(true);
    fetch(`/api/documents?${params}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Paperless request failed with ${response.status}`);
        }
        return response.json();
      })
      .then(
        (payload: {
          configured?: boolean;
          results?: PaperlessDocument[];
          pagination?: {
            count: number;
            page: number;
            pageSize: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
          };
          metadata?: {
            correspondents?: string[];
            documentTypes?: string[];
            tags?: string[];
          };
        }) => {
          if (!payload.configured || !payload.results) {
            setConnectionError(null);
            return;
          }
          setPaperlessConnected(true);
          setConnectionError(null);
          setDocuments(payload.results);
          if (payload.pagination) setPagination(payload.pagination);
          if (payload.metadata?.correspondents?.length) {
            setCorrespondentOptions(payload.metadata.correspondents);
          }
          if (payload.metadata?.documentTypes?.length) {
            setDocumentTypeOptions(payload.metadata.documentTypes);
          }
          if (payload.metadata?.tags?.length) {
            setTagOptions(payload.metadata.tags);
          }
          const preferred = initialDocumentId
            ? (payload.results.find(
                (document) => document.id === initialDocumentId,
              ) ?? payload.results[0])
            : payload.results[0];
          if (preferred) {
            setSelectedId(preferred.id);
            setSelectedDocument(preferred);
          }
        },
      )
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setConnectionError(
          "Couldn’t refresh Paperless. Check the connection and try again.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingDocuments(false);
      });
    return () => {
      controller.abort();
    };
  }, [
    activeCustomTag,
    activeView,
    debouncedQuery,
    filterCorrespondent,
    filterTag,
    filterType,
    initialDocumentId,
    page,
    refreshKey,
  ]);

  useEffect(() => {
    if (!initialDocumentId) return;

    const controller = new AbortController();
    fetch(`/api/documents?id=${initialDocumentId}&page_size=1`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Document request failed with ${response.status}`);
        }
        return response.json();
      })
      .then(
        (payload: { configured?: boolean; results?: PaperlessDocument[] }) => {
          const document = payload.results?.[0];
          if (!document) {
            if (payload.configured) {
              setToast("Document not found");
              setMobileDetailOpen(false);
              window.history.replaceState(null, "", "/");
            }
            return;
          }
          setSelectedId(document.id);
          setSelectedDocument(document);
        },
      )
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
      });

    return () => controller.abort();
  }, [initialDocumentId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "u") {
        event.preventDefault();
        setUploadOpen(true);
      }
      if (event.key === "Escape") {
        setUploadOpen(false);
        setTagMenuOpen(false);
        setFilterOpen(false);
        setMoreOpen(false);
        setHelpOpen(false);
        setAccountOpen(false);
        setNewViewOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!uploadOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const frame = window.requestAnimationFrame(() => {
      uploadCloseRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      previousFocusRef.current?.focus();
    };
  }, [uploadOpen]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      previewStageRef.current?.scrollTo({ top: 0 });
      paperWrapRef.current?.scrollTo({ top: 0 });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedId]);

  useEffect(() => {
    setPreviewPage(1);
    setMoreOpen(false);
  }, [selectedId]);

  useEffect(() => {
    const stored = window.localStorage.getItem("paperless-custom-views");
    if (!stored) return;
    try {
      setCustomViews(JSON.parse(stored) as CustomView[]);
    } catch {
      window.localStorage.removeItem("paperless-custom-views");
    }
  }, []);

  function chooseDocument(id: number) {
    const document = documents.find((item) => item.id === id);
    setSelectedId(id);
    if (document) setSelectedDocument(document);
    setMobileDetailOpen(true);
    window.history.pushState(null, "", `/documents/${id}`);
  }

  function moveDocument(direction: -1 | 1) {
    const target = visibleDocuments[selectedIndex + direction];
    if (target) chooseDocument(target.id);
  }

  function saveCustomView() {
    if (!newViewName.trim() || !newViewTag) return;
    const view = {
      id: `${Date.now()}`,
      label: newViewName.trim(),
      tag: newViewTag,
    };
    const next = [...customViews, view];
    setCustomViews(next);
    window.localStorage.setItem("paperless-custom-views", JSON.stringify(next));
    setNewViewName("");
    setNewViewTag("");
    setNewViewOpen(false);
    setActiveCustomView(view.id);
    setActiveView("all");
  }

  async function shareDocument() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: selected.title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast("Document link copied");
    } catch {
      setToast("Couldn’t copy the document link");
    }
  }

  async function copyDocumentId() {
    try {
      await navigator.clipboard.writeText(String(selected.id));
      setToast("Document ID copied");
    } catch {
      setToast("Couldn’t copy the document ID");
    } finally {
      setMoreOpen(false);
    }
  }

  async function signOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/login");
    }
  }

  function updateDocument(patch: Partial<PaperlessDocument>) {
    setSelectedDocument((current) =>
      current.id === selected.id ? { ...current, ...patch } : current,
    );
    setDocuments((current) =>
      current.map((document) =>
        document.id === selected.id ? { ...document, ...patch } : document,
      ),
    );
  }

  async function persistDocument(patch: Partial<PaperlessDocument>) {
    const previous = selected;
    updateDocument(patch);
    if (!paperlessConnected) return true;

    try {
      const response = await fetch(`/api/documents/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!response.ok) {
        throw new Error(`Document update failed with ${response.status}`);
      }
      return true;
    } catch {
      updateDocument(previous);
      setToast("Couldn’t save the document changes");
      return false;
    }
  }

  async function markReviewed() {
    const saved = await persistDocument({ status: "ready" });
    if (!saved) return;
    setToast("Document moved out of review");
    const next = visibleDocuments.find(
      (document) => document.id !== selected.id,
    );
    if (next) chooseDocument(next.id);
  }

  function addTag(tag: string) {
    if (!selected.tags.includes(tag)) {
      persistDocument({ tags: [...selected.tags, tag] });
    }
    setTagMenuOpen(false);
  }

  function removeTag(tag: string) {
    persistDocument({ tags: selected.tags.filter((item) => item !== tag) });
  }

  async function handleUpload(file?: File) {
    if (!file || uploading) return;
    setUploading(true);
    const body = new FormData();
    body.append("document", file);
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        body,
      });
      if (!response.ok) throw new Error("Upload failed");
      setToast(`${file.name} sent to Paperless`);
      setRefreshKey((current) => current + 1);
    } catch {
      setToast(`Could not upload ${file.name}`);
    } finally {
      setUploading(false);
      setUploadOpen(false);
    }
  }

  return (
    <main className={cn("app-shell", mobileDetailOpen && "has-mobile-detail")}>
      <aside
        id="primary-navigation"
        className={cn("sidebar", mobileNavOpen && "sidebar--open")}
        inert={uploadOpen ? true : undefined}
      >
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <span className="brand-name">Paperless Studio</span>
          <button
            className="icon-button sidebar-close"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <X size={17} />
          </button>
        </div>

        <button className="upload-button" onClick={() => setUploadOpen(true)}>
          <Plus size={17} strokeWidth={2.4} />
          <span>New document</span>
          <kbd>⌘U</kbd>
        </button>

        <nav className="primary-nav" aria-label="Document views">
          {navItems.map((item) => {
            const Icon = item.icon;
            const count =
              !paperlessConnected &&
              (item.id === "inbox" || item.id === "review")
                ? documents.filter((document) => document.status === "review")
                    .length
                : undefined;
            return (
              <button
                key={item.id}
                className={cn(
                  "nav-item",
                  activeView === item.id && "is-active",
                )}
                aria-current={activeView === item.id ? "page" : undefined}
                onClick={() => {
                  setActiveView(item.id);
                  setActiveCustomView(null);
                  setMobileNavOpen(false);
                }}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {count ? <em>{count}</em> : null}
              </button>
            );
          })}
        </nav>

        <div className="nav-section">
          <div className="nav-section-heading">
            <span>Saved views</span>
            <button
              aria-label="Add saved view"
              aria-expanded={newViewOpen}
              aria-controls="saved-view-form"
              onClick={() => setNewViewOpen((current) => !current)}
            >
              <Plus size={14} />
            </button>
          </div>
          {newViewOpen ? (
            <div id="saved-view-form" className="saved-view-form">
              <input
                value={newViewName}
                onChange={(event) => setNewViewName(event.target.value)}
                placeholder="View name"
                aria-label="Saved view name"
              />
              <select
                value={newViewTag}
                onChange={(event) => setNewViewTag(event.target.value)}
                aria-label="Saved view tag"
              >
                <option value="">Choose tag…</option>
                {tagOptions.map((tag) => (
                  <option key={tag}>{tag}</option>
                ))}
              </select>
              <button
                onClick={saveCustomView}
                disabled={!newViewName || !newViewTag}
              >
                Save view
              </button>
            </div>
          ) : null}
          {savedViews.map((view) => (
            <button
              key={view.id}
              className={cn("nav-item", activeView === view.id && "is-active")}
              onClick={() => {
                setActiveView(view.id);
                setActiveCustomView(null);
                setMobileNavOpen(false);
              }}
            >
              <span
                className="saved-dot"
                style={{ backgroundColor: view.color }}
              />
              <span>{view.label}</span>
            </button>
          ))}
          {customViews.map((view) => (
            <button
              key={view.id}
              className={cn(
                "nav-item",
                activeCustomView === view.id && "is-active",
              )}
              onClick={() => {
                setActiveView("all");
                setActiveCustomView(view.id);
                setMobileNavOpen(false);
              }}
            >
              <span className="saved-dot custom-dot" />
              <span>{view.label}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-popover-wrap">
            <button
              className="nav-item"
              aria-expanded={helpOpen}
              aria-controls="help-popover"
              onClick={() => setHelpOpen((current) => !current)}
            >
              <CircleHelp size={17} />
              <span>Help & shortcuts</span>
            </button>
            {helpOpen ? (
              <div id="help-popover" className="sidebar-popover">
                <strong>Shortcuts</strong>
                <span>
                  <kbd>⌘ K</kbd> Search
                </span>
                <span>
                  <kbd>⌘ U</kbd> Upload
                </span>
                <span>
                  <kbd>Esc</kbd> Close menus
                </span>
              </div>
            ) : null}
          </div>
          <div className="sidebar-popover-wrap">
            <button
              className="account-row"
              aria-expanded={accountOpen}
              aria-controls="account-popover"
              onClick={() => setAccountOpen((current) => !current)}
            >
              <span className="avatar">
                {(authUsername ?? "Paperless").slice(0, 1).toUpperCase()}
              </span>
              <span>
                <strong>{authUsername ?? "Paperless"}</strong>
                <small>
                  {paperlessConnected ? "Connected workspace" : "Local preview"}
                </small>
              </span>
              <MoreHorizontal size={16} />
            </button>
            {accountOpen ? (
              <div
                id="account-popover"
                className="sidebar-popover account-popover"
              >
                <strong>Paperless connection</strong>
                <span className="connection-state">
                  <i
                    className={cn(
                      !paperlessConnected && "is-offline",
                      connectionError && "is-error",
                    )}
                  />
                  {paperlessConnected
                    ? "Connected"
                    : connectionError
                      ? "Connection issue"
                      : "Demo mode"}
                </span>
                <small>API credentials stay on the server.</small>
                {authUsername ? (
                  <button className="popover-action" onClick={signOut}>
                    Sign out
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      {mobileNavOpen ? (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <section
        className="document-column"
        inert={uploadOpen ? true : undefined}
      >
        <header className="list-header">
          <div className="mobile-brand">
            <button
              className="icon-button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileNavOpen}
              aria-controls="primary-navigation"
            >
              <Menu size={19} />
            </button>
          </div>
          <div className="search-wrap">
            <Search size={16} />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search documents"
              aria-label="Search documents"
            />
            {query ? (
              <button onClick={() => setQuery("")} aria-label="Clear search">
                <X size={14} />
              </button>
            ) : (
              <kbd>
                <Command size={11} />K
              </kbd>
            )}
          </div>
        </header>

        <div className="list-toolbar">
          <div>
            <p className="eyebrow">
              {activeView === "review" || activeView === "inbox"
                ? "Review queue"
                : "Library"}
            </p>
            <h1>{viewLabels[activeView]}</h1>
          </div>
          <div className="toolbar-actions">
            <span>
              {paperlessConnected ? pagination.count : visibleDocuments.length}
            </span>
            <div className="toolbar-popover-wrap">
              <button
                className={cn("icon-button", filterOpen && "is-pressed")}
                aria-label="Filter documents"
                aria-expanded={filterOpen}
                aria-controls="document-filters"
                onClick={() => setFilterOpen((current) => !current)}
              >
                <SlidersHorizontal size={16} />
              </button>
              {filterOpen ? (
                <div id="document-filters" className="filter-popover">
                  <div>
                    <strong>Filter documents</strong>
                    <button
                      onClick={() => {
                        setFilterCorrespondent("");
                        setFilterType("");
                        setFilterTag("");
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  <label>
                    Correspondent
                    <select
                      value={filterCorrespondent}
                      onChange={(event) =>
                        setFilterCorrespondent(event.target.value)
                      }
                    >
                      <option value="">Any</option>
                      {correspondentOptions.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Type
                    <select
                      value={filterType}
                      onChange={(event) => setFilterType(event.target.value)}
                    >
                      <option value="">Any</option>
                      {documentTypeOptions.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Tag
                    <select
                      value={filterTag}
                      onChange={(event) => setFilterTag(event.target.value)}
                    >
                      <option value="">Any</option>
                      {tagOptions.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
            </div>
            <button
              className="icon-button is-pressed"
              aria-label={
                viewMode === "list"
                  ? "Switch to grid view"
                  : "Switch to list view"
              }
              onClick={() =>
                setViewMode((current) => (current === "list" ? "grid" : "list"))
              }
            >
              {viewMode === "list" ? (
                <Grid2X2 size={16} />
              ) : (
                <LayoutList size={16} />
              )}
            </button>
          </div>
        </div>
        {connectionError ? (
          <div className="connection-banner" role="alert">
            <span>{connectionError}</span>
            <button onClick={() => setRefreshKey((current) => current + 1)}>
              Try again
            </button>
          </div>
        ) : null}

        <div
          ref={listRef}
          className={cn(
            "document-list",
            loadingDocuments && "is-loading",
            viewMode === "grid" && "is-grid",
          )}
          aria-busy={loadingDocuments}
        >
          {visibleDocuments.length ? (
            visibleDocuments.map((document, index) => (
              <button
                key={document.id}
                className={cn(
                  "document-row",
                  selected.id === document.id && "is-selected",
                )}
                onClick={() => chooseDocument(document.id)}
                style={{ "--delay": `${index * 34}ms` } as React.CSSProperties}
              >
                <DocumentThumbnail document={document} />
                <span className="document-row-content">
                  <span className="document-row-topline">
                    <strong>{document.title}</strong>
                    {document.status === "review" ? (
                      <span className="review-dot" title="Needs review" />
                    ) : null}
                  </span>
                  <span className="document-correspondent">
                    {document.correspondent}
                  </span>
                  <span className="document-meta">
                    <span>{document.added}</span>
                    <i>·</i>
                    <span>{document.documentType}</span>
                  </span>
                  <span className="mini-tags">
                    {document.tags.slice(0, 2).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <div className="empty-state">
              <Search size={22} />
              <h2>No documents found</h2>
              <p>Try a title, correspondent, type, or tag.</p>
              <button onClick={() => setQuery("")}>Clear search</button>
            </div>
          )}
        </div>
        {paperlessConnected && pagination.count > pagination.pageSize ? (
          <nav className="pagination" aria-label="Document pages">
            <span className="pagination-range">
              {(pagination.page - 1) * pagination.pageSize + 1}–
              {Math.min(
                pagination.page * pagination.pageSize,
                pagination.count,
              )}{" "}
              of {pagination.count}
            </span>
            <span className="pagination-pages">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div>
              <button
                onClick={() => {
                  setPage((current) => Math.max(1, current - 1));
                  listRef.current?.scrollTo({ top: 0 });
                }}
                disabled={!pagination.hasPrevious || loadingDocuments}
                aria-label="Previous page"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => {
                  setPage((current) =>
                    Math.min(pagination.totalPages, current + 1),
                  );
                  listRef.current?.scrollTo({ top: 0 });
                }}
                disabled={!pagination.hasNext || loadingDocuments}
                aria-label="Next page"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </nav>
        ) : null}
      </section>

      <section className="preview-column" inert={uploadOpen ? true : undefined}>
        <header className="preview-toolbar">
          <div className="preview-history">
            <button
              className="icon-button mobile-back"
              onClick={() => {
                setMobileDetailOpen(false);
                window.history.pushState(null, "", "/");
              }}
              aria-label="Back to documents"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              className="icon-button"
              aria-label="Previous document"
              disabled={selectedIndex <= 0}
              onClick={() => moveDocument(-1)}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              className="icon-button"
              aria-label="Next document"
              disabled={
                selectedIndex < 0 ||
                selectedIndex >= visibleDocuments.length - 1
              }
              onClick={() => moveDocument(1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
          <div className="preview-actions">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Download document"
              onClick={() => {
                window.location.href = `/api/documents/${selected.id}/download`;
              }}
            >
              <Download size={17} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open PDF in new tab"
              title="Open PDF in new tab"
              onClick={() => {
                window.open(
                  `/api/documents/${selected.id}/preview?title=${encodeURIComponent(selected.title)}`,
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
            >
              <Maximize2 size={17} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Share document"
              title="Share document"
              onClick={shareDocument}
            >
              <Share2 size={17} />
            </Button>
            {selected.sourceUrl ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Show in Paperless"
                title="Show in Paperless"
                onClick={() => {
                  window.open(
                    selected.sourceUrl,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
              >
                <ExternalLink size={17} />
              </Button>
            ) : null}
            <div className="more-menu-wrap">
              <Button
                variant="ghost"
                size="icon"
                aria-label="More options"
                aria-expanded={moreOpen}
                aria-controls="document-more-menu"
                onClick={() => setMoreOpen((current) => !current)}
              >
                <MoreHorizontal size={18} />
              </Button>
              {moreOpen ? (
                <div id="document-more-menu" className="more-menu">
                  <button onClick={copyDocumentId}>Copy document ID</button>
                  <button
                    onClick={() => {
                      persistDocument({
                        status:
                          selected.status === "review" ? "ready" : "review",
                      });
                      setMoreOpen(false);
                    }}
                  >
                    {selected.status === "review"
                      ? "Mark reviewed"
                      : "Return to review"}
                  </button>
                </div>
              ) : null}
            </div>
            <span className="toolbar-divider" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setInspectorOpen((current) => !current)}
              aria-label={inspectorOpen ? "Hide details" : "Show details"}
              aria-expanded={inspectorOpen}
              aria-controls="document-inspector"
              className={inspectorOpen ? "is-active" : ""}
            >
              {inspectorOpen ? (
                <PanelRightClose size={18} />
              ) : (
                <PanelRightOpen size={18} />
              )}
            </Button>
          </div>
        </header>

        <div
          ref={previewStageRef}
          className={cn(
            "preview-stage",
            !inspectorOpen && "preview-stage--wide",
          )}
        >
          <div ref={paperWrapRef} className="paper-wrap">
            {paperlessConnected ? (
              <iframe
                key={`${selected.id}-${previewPage}`}
                className="pdf-preview"
                src={`/api/documents/${selected.id}/preview?title=${encodeURIComponent(selected.title)}#page=${previewPage}&zoom=page-width`}
                title={`Page ${previewPage} of ${selected.title}`}
              />
            ) : (
              <DocumentPaper document={selected} />
            )}
            <div className="page-control">
              <button
                aria-label="Previous PDF page"
                disabled={previewPage <= 1}
                onClick={() =>
                  setPreviewPage((current) => Math.max(1, current - 1))
                }
              >
                <ChevronLeft size={14} />
              </button>
              <span>
                {previewPage} / {selected.pages}
              </span>
              <button
                aria-label="Next PDF page"
                disabled={previewPage >= selected.pages}
                onClick={() =>
                  setPreviewPage((current) =>
                    Math.min(selected.pages, current + 1),
                  )
                }
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <aside
            id="document-inspector"
            className={cn("inspector", !inspectorOpen && "is-hidden")}
          >
            <div className="inspector-scroll">
              <div className="document-heading">
                <div className="title-icon">
                  <FileText size={18} />
                </div>
                <div>
                  <span className="document-id">DOC-{selected.id}</span>
                  <h2>{selected.title}</h2>
                </div>
              </div>

              {selected.status === "review" ? (
                <div className="review-callout">
                  <span className="spark-icon">
                    <Sparkles size={15} />
                  </span>
                  <div>
                    <strong>Ready for review</strong>
                    <p>OCR is complete. Confirm the details to finish.</p>
                  </div>
                </div>
              ) : (
                <div className="reviewed-state">
                  <Check size={15} />
                  <span>Reviewed</span>
                </div>
              )}

              <div className="inspector-section">
                <h3>Details</h3>
                <MetadataSelect
                  label="Correspondent"
                  value={selected.correspondent}
                  options={correspondentOptions}
                  onChange={(value) =>
                    persistDocument({ correspondent: value })
                  }
                />
                <MetadataSelect
                  label="Document type"
                  value={selected.documentType}
                  options={documentTypeOptions}
                  onChange={(value) => persistDocument({ documentType: value })}
                />
                <div className="metadata-row">
                  <span className="metadata-label">Created</span>
                  <input
                    className="metadata-value date-value"
                    type="date"
                    value={toDateInputValue(selected.created)}
                    onChange={(event) =>
                      persistDocument({ created: event.target.value })
                    }
                    aria-label="Created date"
                  />
                </div>
              </div>

              <div className="inspector-section">
                <div className="section-heading">
                  <h3>Tags</h3>
                  <div className="tag-add-wrap">
                    <button
                      className="section-add"
                      aria-expanded={tagMenuOpen}
                      aria-controls="tag-menu"
                      onClick={() => setTagMenuOpen((current) => !current)}
                    >
                      <Plus size={14} />
                      Add
                    </button>
                    {tagMenuOpen ? (
                      <div id="tag-menu" className="tag-menu">
                        <span>Add a tag</span>
                        {tagOptions
                          .filter((tag) => !selected.tags.includes(tag))
                          .map((tag) => (
                            <button key={tag} onClick={() => addTag(tag)}>
                              <Tag size={13} />
                              {tag}
                            </button>
                          ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="tag-list">
                  {selected.tags.map((tag) => (
                    <span key={tag} className="tag-pill">
                      <i />
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        aria-label={`Remove ${tag}`}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="inspector-section">
                <h3>Document</h3>
                <dl className="file-facts">
                  <div>
                    <dt>Pages</dt>
                    <dd>{selected.pages}</dd>
                  </div>
                  <div>
                    <dt>Format</dt>
                    <dd>{selected.format}</dd>
                  </div>
                  <div>
                    <dt>Added</dt>
                    <dd>{selected.added}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="inspector-footer">
              {selected.status === "review" ? (
                <Button variant="primary" onClick={markReviewed}>
                  <Check size={16} />
                  Mark as reviewed
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => persistDocument({ status: "review" })}
                >
                  <RotateCw size={15} />
                  Return to review
                </Button>
              )}
            </div>
          </aside>
        </div>
      </section>

      {uploadOpen ? (
        <div
          className="dialog-layer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-title"
        >
          <button
            className="dialog-scrim"
            onClick={() => setUploadOpen(false)}
            aria-label="Close upload"
            tabIndex={-1}
          />
          <div className="upload-dialog">
            <div className="dialog-heading">
              <div>
                <span className="eyebrow">Paperless consumption</span>
                <h2 id="upload-title">Add a document</h2>
              </div>
              <button
                ref={uploadCloseRef}
                className="icon-button"
                onClick={() => setUploadOpen(false)}
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>
            <label
              className={cn("drop-zone", dragging && "is-dragging")}
              aria-busy={uploading}
              onDragEnter={() => setDragging(true)}
              onDragLeave={() => setDragging(false)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                handleUpload(event.dataTransfer.files[0]);
              }}
            >
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff"
                disabled={uploading}
                onChange={(event) => handleUpload(event.target.files?.[0])}
              />
              <span className="drop-icon">
                <Upload size={21} />
              </span>
              <strong>
                {uploading ? "Sending to Paperless…" : "Drop a file here"}
              </strong>
              <p>or click to choose · PDF, image, or TIFF</p>
            </label>
            <p className="upload-note">
              Paperless will OCR, match, and archive it automatically.
            </p>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="toast" role="status">
          <span>
            <Check size={14} />
          </span>
          {toast}
        </div>
      ) : null}
    </main>
  );
}

function MetadataSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="metadata-row">
      <span className="metadata-label">{label}</span>
      <span className="select-wrap">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown size={13} />
      </span>
    </label>
  );
}

function DocumentThumbnail({ document }: { document: PaperlessDocument }) {
  return (
    <span className={cn("document-thumbnail", `accent-${document.accent}`)}>
      <span className="thumb-header" />
      <span className="thumb-title" />
      <span className="thumb-line thumb-line--wide" />
      <span className="thumb-line" />
      <span className="thumb-table">
        <i />
        <i />
        <i />
      </span>
    </span>
  );
}

function DocumentPaper({ document }: { document: PaperlessDocument }) {
  const isInvoice = document.documentType === "Invoice";
  return (
    <article className={cn("document-paper", `paper-${document.accent}`)}>
      <div className="paper-letterhead">
        <div className="paper-logo">
          <span>N</span>
          <div>
            <strong>{document.correspondent.split(" ")[0]}</strong>
            <small>STUDIO SUPPLY</small>
          </div>
        </div>
        <span className="paper-accent-rule" />
      </div>
      <div className="paper-address">
        <span>{document.correspondent}</span>
        <p>
          Paperless Studio
          <br />
          Skalitzer Straße 100
          <br />
          10997 Berlin
        </p>
      </div>
      <div className="paper-title-row">
        <div>
          <small>
            {isInvoice ? "INVOICE" : document.documentType.toUpperCase()}
          </small>
          <h3>{document.title.replace("Invoice · ", "")}</h3>
        </div>
        <dl>
          <div>
            <dt>Date</dt>
            <dd>{document.created}</dd>
          </div>
          <div>
            <dt>Document no.</dt>
            <dd>26-{document.id}</dd>
          </div>
        </dl>
      </div>
      <table className="paper-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty.</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Compact daylight panel — Model N4</td>
            <td>2</td>
            <td>€ 489.00</td>
            <td>€ 978.00</td>
          </tr>
          <tr>
            <td>Adjustable studio stand</td>
            <td>2</td>
            <td>€ 119.00</td>
            <td>€ 238.00</td>
          </tr>
          <tr>
            <td>Protective transport case</td>
            <td>1</td>
            <td>€ 84.00</td>
            <td>€ 84.00</td>
          </tr>
        </tbody>
      </table>
      <div className="paper-total">
        <div>
          <span>Subtotal</span>
          <strong>€ 1,300.00</strong>
        </div>
        <div>
          <span>VAT 19%</span>
          <strong>€ 247.00</strong>
        </div>
        <div className="grand-total">
          <span>Total</span>
          <strong>€ 1,547.00</strong>
        </div>
      </div>
      <div className="paper-footer">
        <p>
          Please transfer the amount within 14 days using document number 26-
          {document.id} as the reference.
        </p>
        <div>
          <span>Nordlicht GmbH · Hamburg</span>
          <span>IBAN DE48 2004 0000 0142 8840 01</span>
        </div>
      </div>
    </article>
  );
}
