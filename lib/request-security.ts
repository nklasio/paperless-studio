type OriginRequest = {
  headers: Pick<Headers, "get">;
  nextUrl: { origin: string };
};

export function isSameOriginRequest(request: OriginRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  return origin === request.nextUrl.origin;
}
