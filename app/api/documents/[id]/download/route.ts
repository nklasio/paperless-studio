import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const url = process.env.PAPERLESS_URL?.replace(/\/$/, "");
  const token = process.env.PAPERLESS_TOKEN;
  if (!url || !token) {
    return NextResponse.json(
      { error: "Paperless is not configured" },
      { status: 503 },
    );
  }

  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      { error: "Invalid document ID" },
      { status: 400 },
    );
  }

  const response = await fetch(`${url}/api/documents/${id}/download/`, {
    headers: { Authorization: `Token ${token}` },
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
