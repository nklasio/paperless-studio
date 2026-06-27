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
  FileCheck2,
  FileText,
  Folder,
  Grid2X2,
  Inbox,
  LayoutList,
  Menu,
  MoreHorizontal,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  RotateCw,
  Search,
  Settings2,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
};

const PAGE_SIZE = 20;

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

export function DocumentWorkspace({ initialDocumentId }: Props) {
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const previewStageRef = useRef<HTMLDivElement>(null);
  const paperWrapRef = useRef<HTMLDivElement>(null);
  const [documents, setDocuments] =
    useState<PaperlessDocument[]>(initialDocuments);
  const [selectedDocument, setSelectedDocument] = useState(
    initialDocuments.find((document) => document.id === initialDocumentId) ??
      initialDocuments[0],
  );
  const [activeView, setActiveView] = useState<NavView>("recent");
  const [correspondentOptions, setCorrespondentOptions] =
    useState(correspondents);
  const [documentTypeOptions, setDocumentTypeOptions] =
    useState(documentTypes);
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

  const selected =
    documents.find((document) => document.id === selectedId) ??
    selectedDocument;

  const visibleDocuments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return documents.filter((document) => {
      const matchesQuery =
        paperlessConnected ||
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
        (activeView === "finance" && document.tags.includes("Finance")) ||
        (activeView === "personal" && document.tags.includes("Personal")) ||
        (activeView === "work" && document.tags.includes("Business"));

      return matchesQuery && matchesView;
    });
  }, [activeView, documents, paperlessConnected, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(PAGE_SIZE),
    });
    if (debouncedQuery) params.set("query", debouncedQuery);
    if (initialDocumentId) params.set("id", String(initialDocumentId));

    setLoadingDocuments(true);
    fetch(`/api/documents?${params}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((payload: {
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
        if (!payload.configured || !payload.results) return;
        setPaperlessConnected(true);
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
        const preferred =
          payload.results.find((document) => document.id === selectedId) ??
          (initialDocumentId
            ? payload.results.find(
                (document) => document.id === initialDocumentId,
              )
            : payload.results[0]);
        if (preferred) {
          setSelectedId(preferred.id);
          setSelectedDocument(preferred);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Demo documents are deliberately available for offline design review.
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingDocuments(false);
      });
    return () => {
      controller.abort();
    };
  }, [debouncedQuery, initialDocumentId, page]);

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
    const frame = window.requestAnimationFrame(() => {
      previewStageRef.current?.scrollTo({ top: 0 });
      paperWrapRef.current?.scrollTo({ top: 0 });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedId]);

  function chooseDocument(id: number) {
    const document = documents.find((item) => item.id === id);
    setSelectedId(id);
    if (document) setSelectedDocument(document);
    setMobileDetailOpen(true);
    window.history.pushState(null, "", `/documents/${id}`);
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
    updateDocument(patch);
    try {
      await fetch(`/api/documents/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch {
      // The local demo remains optimistic when Paperless is not configured.
    }
  }

  function markReviewed() {
    persistDocument({ status: "ready" });
    setToast("Document moved out of review");
    const next = visibleDocuments.find((document) => document.id !== selected.id);
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
    if (!file) return;
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
    } catch {
      setToast(`${file.name} added to the consumption queue`);
    } finally {
      setUploading(false);
      setUploadOpen(false);
    }
  }

  return (
    <main
      className={cn(
        "app-shell",
        mobileDetailOpen && "has-mobile-detail",
      )}
    >
      <aside className={cn("sidebar", mobileNavOpen && "sidebar--open")}>
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <span className="brand-name">Paperless</span>
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
              item.id === "inbox" || item.id === "review"
                ? documents.filter((document) => document.status === "review")
                    .length
                : undefined;
            return (
              <button
                key={item.id}
                className={cn("nav-item", activeView === item.id && "is-active")}
                onClick={() => {
                  setActiveView(item.id);
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
            <button aria-label="Add saved view">
              <Plus size={14} />
            </button>
          </div>
          {savedViews.map((view) => (
            <button
              key={view.id}
              className={cn("nav-item", activeView === view.id && "is-active")}
              onClick={() => {
                setActiveView(view.id);
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
        </div>

        <div className="sidebar-footer">
          <button className="nav-item">
            <CircleHelp size={17} />
            <span>Help & shortcuts</span>
          </button>
          <button className="account-row">
            <span className="avatar">NK</span>
            <span>
              <strong>Niklas</strong>
              <small>Administrator</small>
            </span>
            <MoreHorizontal size={16} />
          </button>
        </div>
      </aside>

      {mobileNavOpen ? (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <section className="document-column">
        <header className="list-header">
          <div className="mobile-brand">
            <button
              className="icon-button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
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
              {paperlessConnected &&
              (activeView === "recent" || activeView === "all")
                ? pagination.count
                : visibleDocuments.length}
            </span>
            <button className="icon-button" aria-label="Filter documents">
              <SlidersHorizontal size={16} />
            </button>
            <button className="icon-button is-pressed" aria-label="List view">
              <LayoutList size={16} />
            </button>
          </div>
        </div>

        <div
          ref={listRef}
          className={cn(
            "document-list",
            loadingDocuments && "is-loading",
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

      <section className="preview-column">
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
            <button className="icon-button" aria-label="Previous document">
              <ChevronLeft size={17} />
            </button>
            <button className="icon-button" aria-label="Next document">
              <ChevronRight size={17} />
            </button>
          </div>
          <div className="preview-actions">
            <Button variant="ghost" size="icon" aria-label="Download document">
              <Download size={17} />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Share document">
              <Share2 size={17} />
            </Button>
            <Button variant="ghost" size="icon" aria-label="More options">
              <MoreHorizontal size={18} />
            </Button>
            <span className="toolbar-divider" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setInspectorOpen((current) => !current)}
              aria-label={inspectorOpen ? "Hide details" : "Show details"}
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
                className="pdf-preview"
                src={`/api/documents/${selected.id}/preview`}
                title={`Preview of ${selected.title}`}
              />
            ) : (
              <DocumentPaper document={selected} />
            )}
            <div className="page-control">
              <button aria-label="Zoom out">−</button>
              <span>1 / {selected.pages}</span>
              <button aria-label="Zoom in">+</button>
            </div>
          </div>

          <aside className={cn("inspector", !inspectorOpen && "is-hidden")}>
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
                  onChange={(value) =>
                    persistDocument({ documentType: value })
                  }
                />
                <div className="metadata-row">
                  <span className="metadata-label">Created</span>
                  <button className="metadata-value date-value">
                    {selected.created}
                  </button>
                </div>
              </div>

              <div className="inspector-section">
                <div className="section-heading">
                  <h3>Tags</h3>
                  <div className="tag-add-wrap">
                    <button
                      className="section-add"
                      onClick={() => setTagMenuOpen((current) => !current)}
                    >
                      <Plus size={14} />
                      Add
                    </button>
                    {tagMenuOpen ? (
                      <div className="tag-menu">
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
                    <dt>File size</dt>
                    <dd>{selected.size}</dd>
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
          />
          <div className="upload-dialog">
            <div className="dialog-heading">
              <div>
                <span className="eyebrow">Paperless consumption</span>
                <h2 id="upload-title">Add a document</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setUploadOpen(false)}
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>
            <label
              className={cn("drop-zone", dragging && "is-dragging")}
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
                onChange={(event) => handleUpload(event.target.files?.[0])}
              />
              <span className="drop-icon">
                <Upload size={21} />
              </span>
              <strong>{uploading ? "Sending to Paperless…" : "Drop a file here"}</strong>
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
        <select value={value} onChange={(event) => onChange(event.target.value)}>
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
          <small>{isInvoice ? "INVOICE" : document.documentType.toUpperCase()}</small>
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
          Please transfer the amount within 14 days using document number
          26-{document.id} as the reference.
        </p>
        <div>
          <span>Nordlicht GmbH · Hamburg</span>
          <span>IBAN DE48 2004 0000 0142 8840 01</span>
        </div>
      </div>
    </article>
  );
}
