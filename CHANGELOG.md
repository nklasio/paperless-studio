# Changelog

All notable changes to Paperless Studio are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and the
project follows [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-06-28

### Added

- Paginated inbox, recent, review, all-document, and saved views backed by the
  paperless-ngx API.
- Full-text document search and server-side metadata filtering.
- PDF preview, named PDF pop-out, download, sharing, and direct Paperless links.
- Correspondent, document type, date, tag, and review-state editing with
  optimistic updates and rollback.
- Drag-and-drop document uploads.
- List and grid layouts, responsive navigation, document pagination, and a
  keyboard shortcut system.
- Optional environment-defined local authentication with signed, HTTP-only
  sessions and login throttling.
- Docker and Docker Compose support with multi-architecture GHCR publishing.
- Mock data mode for development without a Paperless server.

### Security

- Paperless credentials remain server-side.
- Document and authentication mutations enforce same-origin requests.
- Protected routes verify local sessions at both the request proxy and API
  boundary.
- Upstream requests have bounded timeouts and uploads have configurable size
  limits.
- GitHub Actions are pinned to immutable commits.

### Project

- GPL-3.0-only licensing, contribution guidelines, security policy, code of
  conduct, architecture guide, roadmap, and issue templates.
- CI checks formatting, linting, unit tests, TypeScript, production builds, and
  the container image.

[0.1.0]: https://github.com/nklasio/paperless-studio/releases/tag/v0.1.0
