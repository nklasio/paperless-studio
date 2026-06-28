import { NextRequest, NextResponse } from "next/server";
import { requireDocumentAuthentication } from "@/lib/auth-route";
import { paperlessConfiguration, paperlessFetch } from "@/lib/paperless-api";
import { paperlessDocumentUrl } from "@/lib/paperless-links";
import {
  buildDocumentQuery,
  type PaperlessMetadataItem,
} from "@/lib/paperless-query";
import { isSameOriginRequest } from "@/lib/request-security";

type PaperlessCollection<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
};

type PaperlessDocumentRecord = {
  id: number;
  title: string;
  correspondent: number | null;
  document_type: number | null;
  tags: number[];
  created: string;
  added: string;
  page_count?: number;
  original_file_name?: string;
};

function requestedPositiveInteger(
  value: string | null,
  fallback: number,
  maximum?: number,
) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return maximum ? Math.min(parsed, maximum) : parsed;
}

async function readCollection<T>(response: Response) {
  const payload = (await response.json()) as PaperlessCollection<T>;
  return {
    ...payload,
    results: Array.isArray(payload.results) ? payload.results : [],
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Unknown";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function emptyPagination(page: number, pageSize: number) {
  return {
    count: 0,
    page,
    pageSize,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };
}

export async function GET(request: NextRequest) {
  const authenticationFailure = await requireDocumentAuthentication(request);
  if (authenticationFailure) return authenticationFailure;

  if (!paperlessConfiguration()) {
    return NextResponse.json(
      { configured: false, results: [] },
      { status: 200 },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const page = requestedPositiveInteger(searchParams.get("page"), 1);
  const pageSize = requestedPositiveInteger(
    searchParams.get("page_size"),
    20,
    50,
  );

  try {
    const metadataResponses = await Promise.all([
      paperlessFetch("/api/correspondents/?page_size=1000", {
        next: { revalidate: 300 },
      }),
      paperlessFetch("/api/document_types/?page_size=1000", {
        next: { revalidate: 300 },
      }),
      paperlessFetch("/api/tags/?page_size=1000", {
        next: { revalidate: 300 },
      }),
    ]);
    const failedMetadataResponse = metadataResponses.find(
      (response) => !response.ok,
    );
    if (failedMetadataResponse) {
      return NextResponse.json(
        { error: "Could not load Paperless metadata" },
        { status: failedMetadataResponse.status },
      );
    }

    const [correspondentPayload, typePayload, tagPayload] = await Promise.all([
      readCollection<PaperlessMetadataItem>(metadataResponses[0]),
      readCollection<PaperlessMetadataItem>(metadataResponses[1]),
      readCollection<PaperlessMetadataItem>(metadataResponses[2]),
    ]);
    const { params, hasMatches } = buildDocumentQuery(
      {
        page,
        pageSize,
        query: searchParams.get("query") ?? undefined,
        documentId: searchParams.get("id") ?? undefined,
        view: searchParams.get("view") ?? undefined,
        customTag: searchParams.get("custom_tag") ?? undefined,
        correspondent: searchParams.get("correspondent") ?? undefined,
        documentType: searchParams.get("document_type") ?? undefined,
        tag: searchParams.get("tag") ?? undefined,
      },
      tagPayload.results,
    );

    const names = (items: PaperlessMetadataItem[]) =>
      new Map(items.map((item) => [item.id, item.name]));
    const correspondentNames = names(correspondentPayload.results);
    const typeNames = names(typePayload.results);
    const tagNames = names(tagPayload.results);
    const metadata = {
      correspondents: Array.from(correspondentNames.values()).sort(),
      documentTypes: Array.from(typeNames.values()).sort(),
      tags: Array.from(tagNames.values()).sort(),
    };

    if (!hasMatches) {
      return NextResponse.json({
        configured: true,
        results: [],
        metadata,
        pagination: emptyPagination(page, pageSize),
      });
    }

    const documentResponse = await paperlessFetch(`/api/documents/?${params}`, {
      cache: "no-store",
    });
    if (!documentResponse.ok) {
      return NextResponse.json(
        { error: "Could not load Paperless documents" },
        { status: documentResponse.status },
      );
    }
    const documentPayload =
      await readCollection<PaperlessDocumentRecord>(documentResponse);
    const accents = ["blue", "ochre", "sage", "plum", "slate"] as const;
    const results = documentPayload.results.map((document) => {
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
        sourceUrl: paperlessDocumentUrl(
          process.env.PAPERLESS_PUBLIC_URL,
          document.id,
        ),
        accent: accents[document.id % accents.length],
      };
    });

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
  } catch {
    return NextResponse.json(
      { error: "Paperless did not respond in time" },
      { status: 504 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Cross-origin requests are not allowed" },
      { status: 403 },
    );
  }
  const authenticationFailure = await requireDocumentAuthentication(request);
  if (authenticationFailure) return authenticationFailure;

  if (!paperlessConfiguration()) {
    return NextResponse.json(
      { error: "Paperless is not configured" },
      { status: 503 },
    );
  }

  const configuredMaximum = Number(
    process.env.PAPERLESS_MAX_UPLOAD_SIZE_MB ?? 100,
  );
  const maximumBytes =
    (Number.isFinite(configuredMaximum) && configuredMaximum > 0
      ? configuredMaximum
      : 100) *
    1024 *
    1024;
  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (declaredSize > maximumBytes) {
    return NextResponse.json(
      { error: "The uploaded document is too large" },
      { status: 413 },
    );
  }

  try {
    const formData = await request.formData();
    const document = formData.get("document");
    if (!(document instanceof File) || document.size === 0) {
      return NextResponse.json(
        { error: "A non-empty document file is required" },
        { status: 400 },
      );
    }
    if (document.size > maximumBytes) {
      return NextResponse.json(
        { error: "The uploaded document is too large" },
        { status: 413 },
      );
    }

    const response = await paperlessFetch("/api/documents/post_document/", {
      method: "POST",
      body: formData,
    });
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Paperless did not respond in time" },
      { status: 504 },
    );
  }
}
