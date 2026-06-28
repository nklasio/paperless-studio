import { NextRequest, NextResponse } from "next/server";
import {
  paperlessConfiguration,
  paperlessFetch,
  validPaperlessId,
} from "@/lib/paperless-api";
import { isSameOriginRequest } from "@/lib/request-security";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Cross-origin requests are not allowed" },
      { status: 403 },
    );
  }

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

  let patch: {
    correspondent?: string;
    documentType?: string;
    tags?: string[];
    status?: "review" | "ready";
    created?: string;
  };
  try {
    patch = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const metadataResponses = await Promise.all([
    paperlessFetch("/api/correspondents/?page_size=1000"),
    paperlessFetch("/api/document_types/?page_size=1000"),
    paperlessFetch("/api/tags/?page_size=1000"),
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

  const [correspondentResponse, typeResponse, tagResponse] = metadataResponses;
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
  const currentResponse = await paperlessFetch(`/api/documents/${id}/`);
  if (!currentResponse.ok) {
    return NextResponse.json(
      { error: "Could not load the Paperless document" },
      { status: currentResponse.status },
    );
  }
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
      const createResponse = await paperlessFetch("/api/tags/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Needs review",
          color: "#3b72d9",
          text_color: "#ffffff",
        }),
      });
      if (!createResponse.ok) {
        return NextResponse.json(
          { error: "Could not create the Needs review tag" },
          { status: createResponse.status },
        );
      }
      reviewTag = (await createResponse.json()).id as number;
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

  const response = await paperlessFetch(`/api/documents/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return new NextResponse(response.body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
