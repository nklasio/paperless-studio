import { NextResponse } from "next/server";
import {
  paperlessConfiguration,
  paperlessFetch,
  validPaperlessId,
} from "@/lib/paperless-api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const response = await paperlessFetch(`/api/documents/${id}/preview/`, {
    cache: "no-store",
  });

  return new NextResponse(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/pdf",
      "Cache-Control": "private, max-age=300",
    },
  });
}
