# Paperless Studio

[![CI](https://github.com/nklasio/paperless-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/nklasio/paperless-studio/actions/workflows/ci.yml)

Paperless Studio is a focused, desktop-like web interface for
[paperless-ngx](https://github.com/paperless-ngx/paperless-ngx). It keeps
Paperless responsible for OCR, storage, consumption, permissions, and
archiving while providing a fast workspace for finding and reviewing
documents.

> [!IMPORTANT]
> Paperless Studio is an independent community project and is not affiliated
> with or endorsed by the paperless-ngx project.

## Features

- Inbox, recently added, and needs-review views
- Paginated document search with list and grid layouts
- PDF preview and page navigation
- Correspondent, document type, created date, and tag editing
- Drag-and-drop document upload
- Review workflow backed by a `Needs review` Paperless tag
- Saved views, responsive navigation, and keyboard shortcuts
- Server-side API proxying so the Paperless token is not sent to the browser

The app falls back to representative demo data when Paperless is not
configured, which makes UI work possible without a running Paperless server.

## Quick start

Requirements:

- Node.js 20.9 or newer
- npm
- A paperless-ngx instance and API token for live data

```bash
git clone https://github.com/nklasio/paperless-studio.git
cd paperless-studio
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. Add your Paperless URL and token to `.env.local`
when you are ready to use live documents:

```env
PAPERLESS_URL=http://localhost:8000
PAPERLESS_TOKEN=replace-with-your-api-token
```

## Add it to a Paperless Docker Compose stack

Clone this repository next to your existing Paperless Compose file, then copy
the following service into that file:

```yaml
services:
  paperless-studio:
    build:
      context: ./paperless-studio
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      PAPERLESS_URL: http://webserver:8000
      PAPERLESS_TOKEN: ${PAPERLESS_STUDIO_TOKEN}
    ports:
      - "3000:3000"
    depends_on:
      - webserver
```

Add the token to the `.env` file used by Docker Compose:

```env
PAPERLESS_STUDIO_TOKEN=replace-with-your-api-token
```

The snippet assumes the Paperless service is named `webserver`, as in the
standard paperless-ngx Compose setup. Change both references if your service
has a different name. Compose puts both services on the same default network,
so Paperless does not need to be exposed on a host port.

Build and start only the new service:

```bash
docker compose up -d --build paperless-studio
```

There is no published container image yet. The Compose service intentionally
builds from the local clone so it can be copied into an existing stack today
and switched to an `image:` later.

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `PAPERLESS_URL` | For live data | Base URL reachable by the Studio server, without a trailing slash |
| `PAPERLESS_TOKEN` | For live data | Paperless API token; kept on the server |

No client-side environment variables are required.

### Security

Paperless Studio currently has no authentication layer of its own. Every user
who can reach it acts through the configured Paperless token and receives that
token's permissions. Do not expose the app directly to the public internet.
Put it behind an authenticated reverse proxy or another trusted access layer,
and use a dedicated Paperless account with the least privileges you need.

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Development

```bash
npm install          # install the locked dependency set
npm run dev          # start the development server
npm run typecheck    # run TypeScript without emitting files
npm run build        # create a production build
npm run check        # run all repository checks
```

The main application lives in
[`components/document-workspace.tsx`](components/document-workspace.tsx).
Paperless integration is isolated in server-side route handlers under
[`app/api`](app/api), and the UI uses mock data from
[`lib/mock-data.ts`](lib/mock-data.ts) when no Paperless connection is
configured.

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before making a larger
change. It documents the data flow, extension points, and current tradeoffs.

## Contributing

Contributions are the point of this project. Bug reports, focused feature
proposals, accessibility improvements, Paperless compatibility fixes, and UI
polish are all welcome.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.
The issue templates are designed to capture enough Paperless and browser
context to reproduce problems quickly. Participation is covered by the
[Code of Conduct](CODE_OF_CONDUCT.md).

## Project status

Paperless Studio is early-stage software. Core document workflows work, but
the API layer and component boundaries are still intentionally small and
approachable. Expect iteration, and please open an issue before investing in a
large architectural change.

## License

Paperless Studio is free software licensed under the
[GNU General Public License v3.0](LICENSE).
