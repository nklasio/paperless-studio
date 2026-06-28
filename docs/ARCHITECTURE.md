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

## Main areas

### UI workspace

`components/document-workspace.tsx` owns the current document workspace:
navigation, search, pagination, selection, preview state, metadata editing,
upload, and review actions.

This is intentionally a single obvious entry point today. Extract a component
when it has a stable responsibility or meaningful independent behavior, not
only to reduce line count.

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

Keep Paperless-specific field names and authentication in this layer. UI
components should use the types in `lib/types.ts`.

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

Prefer a Paperless query parameter for filters that can affect many
documents. Client-side filters only operate on the current paginated result
and should not imply that they search the whole archive.

Keep URL/state behavior explicit if a view should be linkable or survive a
reload.

## Current tradeoffs

- One server-side API token is shared by all Studio users.
- The workspace component still owns several concerns that may become stable
  component boundaries as the product grows.
- Supporting metadata is cached briefly, while document results are not.
- The native browser PDF viewer keeps the bundle small but offers a limited
  control API.

These are useful contribution areas, but changes should preserve a simple
local setup and keep credentials server-side.
