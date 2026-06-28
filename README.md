# Paperless Studio

[![CI](https://github.com/nklasio/paperless-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/nklasio/paperless-studio/actions/workflows/ci.yml)

Paperless Studio is a focused, desktop-like web interface for
[paperless-ngx](https://github.com/paperless-ngx/paperless-ngx). It keeps
Paperless responsible for OCR, storage, consumption, permissions, and archiving
while providing a fast workspace for finding and reviewing documents.

> [!IMPORTANT] Paperless Studio is an independent community project and is not
> affiliated with or endorsed by the paperless-ngx project.

## Features

- Inbox, recently added, and needs-review views
- Paginated document search with list and grid layouts
- PDF preview and page navigation
- Correspondent, document type, created date, and tag editing
- Drag-and-drop document upload
- Review workflow backed by a `Needs review` Paperless tag
- Saved views, responsive navigation, and keyboard shortcuts
- Server-side API proxying so the Paperless token is not sent to the browser

The app falls back to representative demo data when Paperless is not configured,
which makes UI work possible without a running Paperless server.

## Quick start

Requirements:

- Node.js 20.19 or newer
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
PAPERLESS_PUBLIC_URL=http://localhost:8000
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
      PAPERLESS_PUBLIC_URL: ${PAPERLESS_PUBLIC_URL}
      PAPERLESS_STUDIO_USERNAME: ${PAPERLESS_STUDIO_USERNAME}
      PAPERLESS_STUDIO_PASSWORD: ${PAPERLESS_STUDIO_PASSWORD}
      PAPERLESS_STUDIO_SESSION_SECRET: ${PAPERLESS_STUDIO_SESSION_SECRET}
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      - webserver
```

Add the token to the `.env` file used by Docker Compose:

```env
PAPERLESS_STUDIO_TOKEN=replace-with-your-api-token
PAPERLESS_PUBLIC_URL=https://paperless.example.com
PAPERLESS_STUDIO_USERNAME=studio
PAPERLESS_STUDIO_PASSWORD=replace-with-a-strong-password
PAPERLESS_STUDIO_SESSION_SECRET=replace-with-at-least-32-random-characters
```

The snippet assumes the Paperless service is named `webserver`, as in the
standard paperless-ngx Compose setup. Change both references if your service has
a different name. Compose puts both services on the same default network, so
Paperless does not need to be exposed on a host port. Studio binds to the host's
loopback interface by default; use an authenticated reverse proxy on the Compose
network for remote access.

Build and start only the new service:

```bash
docker compose up -d --build paperless-studio
```

The Compose service above builds from a local clone. Tagged releases are also
published to GitHub Container Registry, so the `build` block can be replaced
with a pinned image:

```yaml
services:
  paperless-studio:
    image: ghcr.io/nklasio/paperless-studio:0.1.0
    restart: unless-stopped
    environment:
      PAPERLESS_URL: http://webserver:8000
      PAPERLESS_TOKEN: ${PAPERLESS_STUDIO_TOKEN}
      PAPERLESS_PUBLIC_URL: ${PAPERLESS_PUBLIC_URL}
      PAPERLESS_STUDIO_USERNAME: ${PAPERLESS_STUDIO_USERNAME}
      PAPERLESS_STUDIO_PASSWORD: ${PAPERLESS_STUDIO_PASSWORD}
      PAPERLESS_STUDIO_SESSION_SECRET: ${PAPERLESS_STUDIO_SESSION_SECRET}
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      - webserver
```

Use `latest` to follow the newest stable release, or pin a full version for
predictable deployments. See [docs/RELEASING.md](docs/RELEASING.md) for the
tagging and image-version policy.

## Configuration

| Variable                          | Required      | Description                                                       |
| --------------------------------- | ------------- | ----------------------------------------------------------------- |
| `PAPERLESS_URL`                   | For live data | Base URL reachable by the Studio server, without a trailing slash |
| `PAPERLESS_TOKEN`                 | For live data | Paperless API token; kept on the server                           |
| `PAPERLESS_PUBLIC_URL`            | No            | Browser-facing Paperless URL for “Show in Paperless”              |
| `PAPERLESS_REQUEST_TIMEOUT_MS`    | No            | Upstream request timeout in milliseconds; defaults to `15000`     |
| `PAPERLESS_MAX_UPLOAD_SIZE_MB`    | No            | Maximum accepted upload size in MiB; defaults to `100`            |
| `PAPERLESS_STUDIO_USERNAME`       | No            | Enables the local account when set with the other auth variables  |
| `PAPERLESS_STUDIO_PASSWORD`       | No            | Password for the local account                                    |
| `PAPERLESS_STUDIO_SESSION_SECRET` | No            | Random session-signing secret of at least 32 characters           |

No client-side environment variables are required.

### Generate a session secret

The built-in local account needs a random signing secret. Generate one with:

```bash
openssl rand -hex 32
```

Copy the output into your environment or Compose `.env` file:

```env
PAPERLESS_STUDIO_USERNAME=studio
PAPERLESS_STUDIO_PASSWORD=replace-with-a-strong-password
PAPERLESS_STUDIO_SESSION_SECRET=paste-the-generated-value-here
```

The generated value signs Studio login sessions; it is not a Paperless API token
or a browser session cookie. Restart Studio after changing it. Existing login
sessions become invalid when the secret changes.

### Compatibility

The current release is verified against paperless-ngx `2.20.15` (API version
`9`). Studio requests the stable version 1 response shape and should work with
older supported Paperless releases; please include your Paperless version when
reporting an integration issue.

### Security

Paperless Studio provides an optional environment-defined local account. Leaving
all three authentication variables unset preserves contributor demo mode. Every
signed-in user still acts through the configured Paperless token and receives
that token's permissions.

For remote access, terminate HTTPS at a trusted reverse proxy and use a
dedicated Paperless account with the least privileges you need. See
[docs/AUTHENTICATION.md](docs/AUTHENTICATION.md) for the security model and
future provider path.

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Development

```bash
npm install          # install the locked dependency set
npm run dev          # start the development server
npm run lint         # run Next.js, React, and accessibility lint rules
npm test             # run the unit test suite once
npm run format:check # verify repository formatting
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

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before making a larger change.
It documents the data flow, extension points, and current tradeoffs. The
[project roadmap](ROADMAP.md) describes the next release target and its
acceptance criteria.

## Contributing

Contributions are the point of this project. Bug reports, focused feature
proposals, accessibility improvements, Paperless compatibility fixes, and UI
polish are all welcome.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.
The issue templates are designed to capture enough Paperless and browser context
to reproduce problems quickly. Participation is covered by the
[Code of Conduct](CODE_OF_CONDUCT.md).

## Project status

Paperless Studio is early-stage software. Core document workflows work, but the
API layer and component boundaries are still intentionally small and
approachable. Expect iteration, and please open an issue before investing in a
large architectural change. The current planned milestone is `v0.2.0`, focused
on daily-driver reliability.

## License

Paperless Studio is free software licensed under the
[GNU General Public License v3.0](LICENSE).
