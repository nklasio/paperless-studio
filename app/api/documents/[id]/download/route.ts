import { NextRequest, NextResponse } from "next/server";
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
    return NextResponse.json(
      { error: "Paperless is not configured" },
      { status: 503 },
    );
  }

  const { id } = await params;
  if (!validPaperlessId(id)) {
    return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
  }

  const response = await paperlessFetch(`/api/documents/${id}/download/`, {
    cache: "no-store",
  });

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
}
