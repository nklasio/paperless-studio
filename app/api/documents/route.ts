import { NextRequest, NextResponse } from "next/server";

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
  const documentParams = new URLSearchParams({ page_size: "100" });
  if (search.trim()) {
    documentParams.set("query", search.trim());
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
        cache: "no-store",
      }),
      fetch(`${config.url}/api/document_types/?page_size=1000`, {
        headers,
        cache: "no-store",
      }),
      fetch(`${config.url}/api/tags/?page_size=1000`, {
        headers,
        cache: "no-store",
      }),
    ]);

  if (!documentResponse.ok) {
    return NextResponse.json(
      { error: "Paperless request failed" },
      { status: documentResponse.status },
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
        size: document.original_file_name?.split(".").pop()?.toUpperCase() ?? "PDF",
        status: tags.some((tag) => tag.toLowerCase() === "needs review")
          ? "review"
          : "ready",
        accent: accents[index % accents.length],
      };
    },
  );

  return NextResponse.json({ configured: true, results, metadata });
}

export async function POST(request: NextRequest) {
  const config = configuration();
  if (!config) {
    return NextResponse.json(
      { error: "Paperless is not configured" },
      { status: 503 },
    );
  }

  const formData = await request.formData();
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
