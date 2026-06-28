import "server-only";

const DEFAULT_TIMEOUT_MS = 15_000;

export function paperlessConfiguration() {
  const url = process.env.PAPERLESS_URL?.replace(/\/$/, "");
  const token = process.env.PAPERLESS_TOKEN;
  return url && token ? { url, token } : null;
}

function requestTimeout() {
  const configured = Number(process.env.PAPERLESS_REQUEST_TIMEOUT_MS);
  return Number.isFinite(configured) && configured >= 1_000
    ? configured
    : DEFAULT_TIMEOUT_MS;
}

export function paperlessFetch(
  path: string,
  init: RequestInit & { next?: { revalidate?: number } } = {},
) {
  const config = paperlessConfiguration();
  if (!config) throw new Error("Paperless is not configured");

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Token ${config.token}`);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json; version=1");
  }

  return fetch(`${config.url}${path}`, {
    ...init,
    headers,
    signal: init.signal ?? AbortSignal.timeout(requestTimeout()),
  });
}

export function validPaperlessId(id: string) {
  return /^\d+$/.test(id);
}
