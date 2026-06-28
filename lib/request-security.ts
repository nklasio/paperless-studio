type OriginRequest = {
  headers: Pick<Headers, "get">;
  url: string;
};

export function isSameOriginRequest(request: OriginRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const host =
      request.headers.get("x-forwarded-host") ??
      request.headers.get("host") ??
      requestUrl.host;
    const protocol =
      request.headers.get("x-forwarded-proto") ??
      requestUrl.protocol.slice(0, -1);
    return originUrl.host === host && originUrl.protocol === `${protocol}:`;
  } catch {
    return false;
  }
}
