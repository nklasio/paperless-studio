export function paperlessDocumentUrl(
  baseUrl: string | undefined,
  documentId: number,
) {
  if (!baseUrl) return undefined;

  try {
    const url = new URL(baseUrl);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      return undefined;
    }

    url.pathname = `${url.pathname.replace(/\/$/, "")}/documents/${documentId}`;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return undefined;
  }
}
