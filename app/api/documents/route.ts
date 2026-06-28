import { NextRequest, NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/request-security";

function configuration() {
  const url = process.env.PAPERLESS_URL?.replace(/\/$/, "");
  const token = process.env.PAPERLESS_TOKEN;
  return url && token ? { url, token } : null;
}

export async function GET(request: NextRequest) {
  const config = configuration();
  if (!config) {
    return NextResponse.json(
      { configured: false, results: [] },
      { status: 200 },
    );
  }

  const search = request.nextUrl.searchParams.get("query") ?? "";
  const requestedPage = Number(request.nextUrl.searchParams.get("page") ?? 1);
  const requestedPageSize = Number(
    request.nextUrl.searchParams.get("page_size") ?? 20,
  );
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize =
    Number.isInteger(requestedPageSize) && requestedPageSize > 0
      ? Math.min(requestedPageSize, 50)
      : 20;
  const documentParams = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (search.trim()) {
    documentParams.set("query", search.trim());
  }
  const documentId = request.nextUrl.searchParams.get("id");
  if (documentId && /^\d+$/.test(documentId)) {
    documentParams.set("id__in", documentId);
  }
  const headers = { Authorization: `Token ${config.token}` };
  const [documentResponse, correspondentResponse, typeResponse, tagResponse] =
    await Promise.all([
      fetch(`${config.url}/api/documents/?${documentParams}`, {
        headers,
        cache: "no-store",
      }),
      fetch(`${config.url}/api/correspondents/?page_size=1000`, {
        headers,
        next: { revalidate: 300 },
      }),
      fetch(`${config.url}/api/document_types/?page_size=1000`, {
        headers,
        next: { revalidate: 300 },
      }),
      fetch(`${config.url}/api/tags/?page_size=1000`, {
        headers,
        next: { revalidate: 300 },
      }),
    ]);

  if (
    !documentResponse.ok ||
    !correspondentResponse.ok ||
    !typeResponse.ok ||
    !tagResponse.ok
  ) {
    return NextResponse.json(
      { error: "Paperless request failed" },
      {
        status: [
          documentResponse,
          correspondentResponse,
          typeResponse,
          tagResponse,
        ].find((response) => !response.ok)?.status,
      },
    );
  }

  const [documentPayload, correspondentPayload, typePayload, tagPayload] =
    await Promise.all([
      documentResponse.json(),
      correspondentResponse.json(),
      typeResponse.json(),
      tagResponse.json(),
    ]);

  const names = <T extends { id: number; name: string }>(items: T[]) =>
    new Map(items.map((item) => [item.id, item.name]));
  const correspondentNames = names(correspondentPayload.results ?? []);
  const typeNames = names(typePayload.results ?? []);
  const tagNames = names(tagPayload.results ?? []);
  const metadata = {
    correspondents: Array.from(correspondentNames.values()).sort(),
    documentTypes: Array.from(typeNames.values()).sort(),
    tags: Array.from(tagNames.values()).sort(),
  };
  const accents = ["blue", "ochre", "sage", "plum", "slate"] as const;
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));

  const results = (documentPayload.results ?? []).map(
    (
      document: {
        id: number;
        title: string;
        correspondent: number | null;
        document_type: number | null;
        tags: number[];
        created: string;
        added: string;
        page_count?: number;
        original_file_name?: string;
      },
      index: number,
    ) => {
      const tags = document.tags
        .map((id) => tagNames.get(id))
        .filter((name): name is string => Boolean(name));
      return {
        id: document.id,
        title: document.title,
        correspondent:
          correspondentNames.get(document.correspondent ?? -1) ?? "Unassigned",
        documentType: typeNames.get(document.document_type ?? -1) ?? "Document",
        tags,
        created: formatDate(document.created),
        added: formatDate(document.added),
        pages: document.page_count ?? 1,
        format:
          document.original_file_name
            ?.match(/\.([^.]+)$/)?.[1]
            ?.toUpperCase() ?? "PDF",
        status: tags.some((tag) => tag.toLowerCase() === "needs review")
          ? "review"
          : "ready",
        accent: accents[index % accents.length],
      };
    },
  );

  const count = Number(documentPayload.count ?? results.length);
  return NextResponse.json({
    configured: true,
    results,
    metadata,
    pagination: {
      count,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(count / pageSize)),
      hasNext: Boolean(documentPayload.next),
      hasPrevious: Boolean(documentPayload.previous),
    },
  });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Cross-origin requests are not allowed" },
      { status: 403 },
    );
  }

  const config = configuration();
  if (!config) {
    return NextResponse.json(
      { error: "Paperless is not configured" },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const document = formData.get("document");
  if (!(document instanceof File) || document.size === 0) {
    return NextResponse.json(
      { error: "A non-empty document file is required" },
      { status: 400 },
    );
  }

  const response = await fetch(`${config.url}/api/documents/post_document/`, {
    method: "POST",
    headers: { Authorization: `Token ${config.token}` },
    body: formData,
  });

  return new NextResponse(response.body, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") ?? "application/json",
    },
  });
}
