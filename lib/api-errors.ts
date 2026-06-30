import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiErrorCode, ApiErrorResponse } from "@/lib/types";

export class PaperlessApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public status: number,
    public retryable: boolean,
    public retryAfter?: string,
  ) {
    super(message);
  }
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  retryable = false,
  retryAfter?: string,
) {
  const body: ApiErrorResponse = { error: { code, message, retryable } };
  return NextResponse.json(body, {
    status,
    headers: retryAfter ? { "Retry-After": retryAfter } : undefined,
  });
}

export function errorFromUpstream(response: Response, fallback: string) {
  const retryAfter = response.headers.get("Retry-After") ?? undefined;
  if (response.status === 401) {
    return new PaperlessApiError(
      "paperless_authentication_failed",
      "Paperless rejected the configured API token.",
      502,
      false,
    );
  }
  if (response.status === 403) {
    return new PaperlessApiError(
      "permission_denied",
      "The Paperless account does not have permission for this action.",
      403,
      false,
    );
  }
  if (response.status === 404) {
    return new PaperlessApiError(
      "not_found",
      "The requested Paperless resource was not found.",
      404,
      false,
    );
  }
  if (response.status === 429) {
    return new PaperlessApiError(
      "rate_limited",
      "Paperless is receiving too many requests. Try again shortly.",
      429,
      true,
      retryAfter,
    );
  }
  return new PaperlessApiError(
    "upstream_unavailable",
    fallback,
    response.status >= 500 ? 502 : response.status,
    response.status >= 500,
  );
}

export function responseForError(error: unknown) {
  if (error instanceof PaperlessApiError) {
    return apiError(
      error.code,
      error.message,
      error.status,
      error.retryable,
      error.retryAfter,
    );
  }
  if (error instanceof ZodError) {
    return apiError(
      "incompatible_response",
      "Paperless returned data Studio could not understand.",
      502,
      false,
    );
  }
  if (
    error instanceof DOMException &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  ) {
    return apiError("timeout", "Paperless did not respond in time.", 504, true);
  }
  return apiError(
    "upstream_unavailable",
    "Paperless is currently unavailable.",
    502,
    true,
  );
}
