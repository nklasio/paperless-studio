# Architecture

Paperless Studio is a small Next.js application that separates the browser
workspace from Paperless credentials and API calls.

## Request flow

```text
Browser UI
  -> Next.js route handler (/api/documents/*)
    -> paperless-ngx API
```

`PAPERLESS_TOKEN` is read only by route handlers. The browser talks to the
same-origin Studio API and never needs the token.

When local authentication is configured, `proxy.ts` performs the early session
check and document route handlers repeat it at the data boundary. Session
signing and credential comparison live in `lib/auth.ts`; this boundary can be
replaced by a future identity provider without changing the Paperless adapter.

## Main areas

### UI workspace

`components/document-workspace.tsx` coordinates navigation, search, pagination,
selection, and preview state. Stable inspector and upload responsibilities live
in focused components, while URL, saved-view, and upload persistence rules live
in independently tested modules under `lib`.

This is intentionally a single obvious entry point today. Extract a component
when it has a stable responsibility or meaningful independent behavior, not only
to reduce line count.

`app/globals.css` contains the visual system and responsive layouts.
`components/ui` contains small reusable primitives.

### Paperless adapter

Route handlers under `app/api/documents` translate between the UI's
`PaperlessDocument` model and paperless-ngx:

- `GET /api/documents` lists documents and supporting metadata.
- `POST /api/documents` forwards uploads.
- `PATCH /api/documents/:id` updates metadata and review state.
- Preview and download routes stream document files without exposing the API
  token.

`PAPERLESS_URL` is the server-to-server address. `PAPERLESS_PUBLIC_URL` is
optional and may point at a different browser-facing origin; Studio uses it only
to construct “Show in Paperless” document links.

Keep Paperless-specific field names and authentication in this layer. UI
components should use the types in `lib/types.ts`. Shared upstream
configuration, authentication, and timeouts live in `lib/paperless-api.ts`;
query translation lives in `lib/paperless-query.ts`.

Runtime response validation and document mapping live in the Paperless contract
and adapter modules. Upstream errors are translated into a stable Studio error
envelope before reaching the browser.

Uploads return a Paperless task UUID. Studio polls its same-origin task route
and stores recent activity in browser local storage; Paperless remains the
source of truth for consumption and OCR.

### Offline UI mode

When the two Paperless environment variables are absent, the list endpoint
reports that it is not configured and the workspace keeps using
`lib/mock-data.ts`. Preserve this behavior when adding features so contributors
can work on the interface without private infrastructure.

## Adding a document field

1. Add the UI-facing field to `lib/types.ts`.
2. Map the Paperless response in `app/api/documents/route.ts`.
3. Add update translation to `app/api/documents/[id]/route.ts` if editable.
4. Add representative mock values.
5. Render and edit the field in the workspace.
6. Test missing and unusually long values.

## Adding a view or filter

Views and metadata filters are translated to Paperless query parameters before
pagination. Keep filters that can affect many documents in that server-side
query path. Demo mode intentionally mirrors those filters over its small local
fixture set.

Keep URL/state behavior explicit if a view should be linkable or survive a
reload.

## Current tradeoffs

- One server-side API token is shared by all Studio users.
- The workspace component still owns several concerns that may become stable
  component boundaries as the product grows.
- Supporting metadata is cached briefly, while document results are not.
- The native browser PDF viewer keeps the bundle small but offers a limited
  control API.

These are useful contribution areas, but changes should preserve a simple local
setup and keep credentials server-side.

## Releases

Pushing a semantic version tag triggers the container release workflow. See
[`RELEASING.md`](RELEASING.md) for the supported tag format, image aliases, and
architectures.
