import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  errorFromUpstream,
  responseForError,
} from "@/lib/api-errors";
import { requireDocumentAuthentication } from "@/lib/auth-route";
import {
  paperlessConfiguration,
  paperlessFetch,
  validPaperlessId,
} from "@/lib/paperless-api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authenticationFailure = await requireDocumentAuthentication(request);
  if (authenticationFailure) return authenticationFailure;

  if (!paperlessConfiguration()) {
    return apiError("not_configured", "Paperless is not configured.", 503);
  }

  const { id } = await params;
  if (!validPaperlessId(id)) {
    return apiError("validation_failed", "Invalid document ID.", 400);
  }

  try {
    const response = await paperlessFetch(`/api/documents/${id}/download/`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw errorFromUpstream(response, "Could not download the document.");
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/octet-stream",
        "Content-Disposition":
          response.headers.get("Content-Disposition") ??
          `attachment; filename="document-${id}.pdf"`,
      },
    });
  } catch (error) {
    return responseForError(error);
  }
}
