import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  apiError,
  errorFromUpstream,
  responseForError,
} from "@/lib/api-errors";
import { requireDocumentAuthentication } from "@/lib/auth-route";
import {
  loadPaperlessMetadata,
  mapPaperlessDocument,
  reviewTagName,
} from "@/lib/paperless-adapter";
import {
  collectionSchema,
  paperlessDocumentSchema,
} from "@/lib/paperless-contracts";
import { paperlessConfiguration, paperlessFetch } from "@/lib/paperless-api";
import { buildDocumentQuery } from "@/lib/paperless-query";
import { isSameOriginRequest } from "@/lib/request-security";

function positiveInteger(
  value: string | null,
  fallback: number,
  maximum?: number,
) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return maximum ? Math.min(parsed, maximum) : parsed;
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
    return NextResponse.json({ configured: false, results: [] });
  }

  const search = request.nextUrl.searchParams;
  const page = positiveInteger(search.get("page"), 1);
  const pageSize = positiveInteger(search.get("page_size"), 20, 50);

  try {
    const metadata = await loadPaperlessMetadata();
    const { params, hasMatches } = buildDocumentQuery(
      {
        page,
        pageSize,
        query: search.get("query") ?? undefined,
        documentId: search.get("id") ?? undefined,
        view: search.get("view") ?? undefined,
        customTag: search.get("custom_tag") ?? undefined,
        correspondent: search.get("correspondent") ?? undefined,
        documentType: search.get("document_type") ?? undefined,
        tag: search.get("tag") ?? undefined,
        reviewTag: reviewTagName(),
      },
      metadata.tags,
    );
    const clientMetadata = {
      correspondents: metadata.correspondents.map((item) => item.name).sort(),
      documentTypes: metadata.documentTypes.map((item) => item.name).sort(),
      tags: metadata.tags.map((item) => item.name).sort(),
      customFields: metadata.customFields,
      reviewTag: reviewTagName(),
    };
    if (!hasMatches) {
      return NextResponse.json({
        configured: true,
        results: [],
        metadata: clientMetadata,
        pagination: emptyPagination(page, pageSize),
      });
    }

    const response = await paperlessFetch(`/api/documents/?${params}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw errorFromUpstream(response, "Could not load Paperless documents.");
    }
    const payload = collectionSchema(paperlessDocumentSchema).parse(
      await response.json(),
    );
    const results = payload.results.map((document) =>
      mapPaperlessDocument(document, metadata),
    );
    const count = payload.count ?? results.length;
    return NextResponse.json({
      configured: true,
      results,
      metadata: clientMetadata,
      pagination: {
        count,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(count / pageSize)),
        hasNext: Boolean(payload.next),
        hasPrevious: Boolean(payload.previous),
      },
      compatibility: {
        paperlessVersion: response.headers.get("X-Version"),
        apiVersion: response.headers.get("X-Api-Version"),
      },
    });
  } catch (error) {
    return responseForError(error);
  }
}

const taskIdSchema = z.string().uuid();

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return apiError(
      "permission_denied",
      "Cross-origin requests are not allowed.",
      403,
    );
  }
  const authenticationFailure = await requireDocumentAuthentication(request);
  if (authenticationFailure) return authenticationFailure;
  if (!paperlessConfiguration()) {
    return apiError("not_configured", "Paperless is not configured.", 503);
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
  if (Number(request.headers.get("content-length") ?? 0) > maximumBytes) {
    return apiError(
      "validation_failed",
      "The uploaded document is too large.",
      413,
    );
  }

  try {
    const formData = await request.formData();
    const document = formData.get("document");
    if (!(document instanceof File) || document.size === 0) {
      return apiError(
        "validation_failed",
        "Choose a non-empty document to upload.",
        400,
      );
    }
    if (document.size > maximumBytes) {
      return apiError(
        "validation_failed",
        "The uploaded document is too large.",
        413,
      );
    }
    const response = await paperlessFetch("/api/documents/post_document/", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw errorFromUpstream(
        response,
        "Paperless could not accept the upload.",
      );
    }
    const raw = await response.json();
    const taskId = taskIdSchema.parse(
      typeof raw === "string" ? raw : (raw?.task_id ?? raw),
    );
    return NextResponse.json({
      taskId,
      fileName: document.name,
      status: "queued",
    });
  } catch (error) {
    return responseForError(error);
  }
}
