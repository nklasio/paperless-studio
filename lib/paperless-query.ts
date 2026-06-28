export type PaperlessMetadataItem = {
  id: number;
  name: string;
};

export type DocumentQueryInput = {
  page: number;
  pageSize: number;
  query?: string;
  documentId?: string;
  view?: string;
  customTag?: string;
  correspondent?: string;
  documentType?: string;
  tag?: string;
};

const savedViewTags: Record<string, string[]> = {
  finance: ["Finance", "Finanzen"],
  personal: ["Personal", "Privatkunden"],
  work: ["Business", "Geschäftlich"],
  review: ["Needs review"],
};

function matchingIds(items: PaperlessMetadataItem[], names: string[]) {
  const normalizedNames = new Set(
    names.map((name) => name.toLocaleLowerCase()),
  );
  return items
    .filter((item) => normalizedNames.has(item.name.toLocaleLowerCase()))
    .map((item) => item.id);
}

export function buildDocumentQuery(
  input: DocumentQueryInput,
  tags: PaperlessMetadataItem[],
) {
  const params = new URLSearchParams({
    page: String(input.page),
    page_size: String(input.pageSize),
    ordering: "-added",
  });

  if (input.query?.trim()) params.set("query", input.query.trim());
  if (input.documentId && /^\d+$/.test(input.documentId)) {
    params.set("id__in", input.documentId);
    return { params, hasMatches: true };
  }

  if (input.view === "inbox") params.set("is_in_inbox", "true");
  const viewTagNames = input.view ? savedViewTags[input.view] : undefined;
  if (viewTagNames) {
    const ids = matchingIds(tags, viewTagNames);
    if (!ids.length) return { params, hasMatches: false };
    params.set("tags__id__in", ids.join(","));
  }

  const requiredTagNames = [input.customTag, input.tag].filter(
    (name): name is string => Boolean(name),
  );
  if (requiredTagNames.length) {
    const ids = matchingIds(tags, requiredTagNames);
    if (
      ids.length !==
      new Set(requiredTagNames.map((name) => name.toLocaleLowerCase())).size
    ) {
      return { params, hasMatches: false };
    }
    params.set("tags__id__all", ids.join(","));
  }

  if (input.correspondent) {
    params.set("correspondent__name__iexact", input.correspondent);
  }
  if (input.documentType) {
    params.set("document_type__name__iexact", input.documentType);
  }

  return { params, hasMatches: true };
}
