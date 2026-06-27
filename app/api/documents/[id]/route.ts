import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
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
  const patch = (await request.json()) as {
    correspondent?: string;
    documentType?: string;
    tags?: string[];
    status?: "review" | "ready";
    created?: string;
  };
  const headers = { Authorization: `Token ${token}` };
  const [correspondentResponse, typeResponse, tagResponse] = await Promise.all([
    fetch(`${url}/api/correspondents/?page_size=1000`, { headers }),
    fetch(`${url}/api/document_types/?page_size=1000`, { headers }),
    fetch(`${url}/api/tags/?page_size=1000`, { headers }),
  ]);
  const [correspondentPayload, typePayload, tagPayload] = await Promise.all([
    correspondentResponse.json(),
    typeResponse.json(),
    tagResponse.json(),
  ]);
  const byName = (items: Array<{ id: number; name: string }>) =>
    new Map(items.map((item) => [item.name.toLowerCase(), item.id]));
  const correspondents = byName(correspondentPayload.results ?? []);
  const types = byName(typePayload.results ?? []);
  const tags = byName(tagPayload.results ?? []);
  const currentResponse = await fetch(`${url}/api/documents/${id}/`, { headers });
  const current = await currentResponse.json();
  const body: Record<string, number | number[] | string | null> = {};

  if (patch.correspondent) {
    body.correspondent =
      correspondents.get(patch.correspondent.toLowerCase()) ?? null;
  }
  if (patch.documentType) {
    body.document_type = types.get(patch.documentType.toLowerCase()) ?? null;
  }
  if (patch.tags) {
    body.tags = patch.tags
      .map((name) => tags.get(name.toLowerCase()))
      .filter((tag): tag is number => tag !== undefined);
  } else if (patch.status) {
    let reviewTag = tags.get("needs review");
    if (patch.status === "review" && !reviewTag) {
      const createResponse = await fetch(`${url}/api/tags/`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Needs review",
          color: "#3b72d9",
          text_color: "#ffffff",
        }),
      });
      if (createResponse.ok) {
        reviewTag = (await createResponse.json()).id as number;
      }
    }
    const currentTags = (current.tags ?? []) as number[];
    body.tags =
      patch.status === "review" && reviewTag
        ? Array.from(new Set([...currentTags, reviewTag]))
        : currentTags.filter((tag) => tag !== reviewTag);
  }
  if (patch.created) {
    body.created = patch.created;
  }

  const response = await fetch(`${url}/api/documents/${id}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return new NextResponse(response.body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
