import "server-only";

import { z } from "zod";
import { errorFromUpstream } from "@/lib/api-errors";
import {
  collectionSchema,
  customFieldDefinitionSchema,
  metadataItemSchema,
  paperlessDocumentSchema,
} from "@/lib/paperless-contracts";
import { paperlessFetch } from "@/lib/paperless-api";
import { paperlessDocumentUrl } from "@/lib/paperless-links";
import type {
  CustomFieldDefinition,
  DocumentCustomField,
  PaperlessDocument,
} from "@/lib/types";

export type PaperlessMetadata = {
  correspondents: z.infer<typeof metadataItemSchema>[];
  documentTypes: z.infer<typeof metadataItemSchema>[];
  tags: z.infer<typeof metadataItemSchema>[];
  customFields: CustomFieldDefinition[];
};

async function fetchCollection<T extends z.ZodType>(
  path: string,
  schema: T,
  revalidate = 300,
) {
  const results: z.infer<T>[] = [];
  let next: string | null = path;
  let pages = 0;
  const parsedCollection = collectionSchema(schema);

  while (next && pages < 100) {
    const response = await paperlessFetch(next, { next: { revalidate } });
    if (!response.ok)
      throw errorFromUpstream(response, "Could not load Paperless metadata.");
    const payload = parsedCollection.parse(await response.json());
    results.push(...payload.results);
    next = payload.next
      ? new URL(payload.next).pathname + new URL(payload.next).search
      : null;
    pages += 1;
  }
  return results;
}

export async function loadPaperlessMetadata(): Promise<PaperlessMetadata> {
  const [correspondents, documentTypes, tags, definitions] = await Promise.all([
    fetchCollection("/api/correspondents/?page_size=100", metadataItemSchema),
    fetchCollection("/api/document_types/?page_size=100", metadataItemSchema),
    fetchCollection("/api/tags/?page_size=100", metadataItemSchema),
    fetchCollection(
      "/api/custom_fields/?page_size=100",
      customFieldDefinitionSchema,
    ),
  ]);
  return {
    correspondents,
    documentTypes,
    tags,
    customFields: definitions.map((field) => ({
      id: field.id,
      name: field.name,
      dataType: field.data_type,
      options: field.extra_data?.select_options,
      defaultCurrency: field.extra_data?.default_currency,
    })),
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

export function reviewTagName() {
  return process.env.PAPERLESS_REVIEW_TAG?.trim() || "Needs review";
}

export function mapPaperlessDocument(
  input: unknown,
  metadata: PaperlessMetadata,
): PaperlessDocument {
  const document = paperlessDocumentSchema.parse(input);
  const names = (items: Array<{ id: number; name: string }>) =>
    new Map(items.map((item) => [item.id, item.name]));
  const correspondentNames = names(metadata.correspondents);
  const typeNames = names(metadata.documentTypes);
  const tagNames = names(metadata.tags);
  const tags = document.tags
    .map((id) => tagNames.get(id))
    .filter((name): name is string => Boolean(name));
  const accents = ["blue", "ochre", "sage", "plum", "slate"] as const;

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
      document.original_file_name?.match(/\.([^.]+)$/)?.[1]?.toUpperCase() ??
      "PDF",
    status: tags.some(
      (tag) => tag.toLocaleLowerCase() === reviewTagName().toLocaleLowerCase(),
    )
      ? "review"
      : "ready",
    sourceUrl: paperlessDocumentUrl(
      process.env.PAPERLESS_PUBLIC_URL,
      document.id,
    ),
    canEdit: document.user_can_change,
    customFields: document.custom_fields.map((field): DocumentCustomField => ({
      fieldId: field.field,
      value: field.value,
    })),
    accent: accents[document.id % accents.length],
  };
}
