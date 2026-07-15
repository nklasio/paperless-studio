# Changelog

All notable changes to Paperless Studio are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and the
project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

- Container releases now build AMD64 and ARM64 images on native runners instead
  of relying on QEMU emulation.

## [0.2.2] - 2026-07-15

### Changed

- Redesigned the document workspace with a more readable typography and surface
  system, balanced pane sizing, and calmer selection states.
- Added a contextual document toolbar, improved preview controls, and roomier
  inline metadata editing.
- Added dedicated Preview and Details tabs to the mobile document experience.

## [0.2.1] - 2026-07-01

### Fixed

- Paperless documents with an unresolved `page_count` no longer prevent the
  document collection from loading.

## [0.2.0] - 2026-06-30

### Added

- Persistent, resumable Paperless upload activity with consumption status.
- Paperless custom-field assignment and scalar-field editing.
- Restorable workspace URLs and versioned saved views with rename and delete.
- Fixture-backed Playwright workflows and automated accessibility checks.

### Changed

- Paperless API responses are validated at runtime and failures use actionable,
  typed error responses.
- Review queues can use a configurable Paperless tag.
- Document permissions now produce a clear read-only inspector.
- Authentication verification is isolated behind a provider boundary.

### Fixed

- Pressing Enter in the password field reliably submits the login form.
- Existing low-contrast interface text now meets WCAG AA requirements.

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

[Unreleased]: https://github.com/nklasio/paperless-studio/compare/v0.2.2...HEAD
[0.2.2]: https://github.com/nklasio/paperless-studio/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/nklasio/paperless-studio/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/nklasio/paperless-studio/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/nklasio/paperless-studio/releases/tag/v0.1.0
