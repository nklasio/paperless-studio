# Roadmap

Paperless Studio is working toward a dependable daily-driver experience while
remaining a small, approachable companion to paperless-ngx. The roadmap favors
trustworthy document workflows over broad feature parity with the upstream
Paperless interface.

## Next release: v0.2.0 — Daily-driver reliability

The goal of v0.2.0 is simple: a contributor should be able to install Studio,
connect a representative Paperless archive, and confidently complete the core
review loop without surprising state loss or silent failures.

### Release blockers

- **Browser-level workflow tests:** Cover login, search, server-side filters,
  pagination, document selection, metadata editing, review completion, and
  logout. Keep the suite deterministic with a small Paperless-compatible test
  fixture rather than private documents.
- **Upload consumption feedback:** Follow the task identifier returned by
  Paperless and show queued, processing, completed, and failed states. A
  successful upload response must not imply that OCR and consumption have
  finished.
- **Resilient API contracts:** Validate the Paperless response shapes used by
  Studio and return actionable errors for authentication, permissions, rate
  limits, timeouts, and incompatible API responses.
- **Accessible interaction pass:** Verify all core workflows with keyboard-only
  navigation, visible focus, 200% zoom, reduced motion, and a screen reader.
  Resolve critical and serious findings before release.
- **Release rehearsal:** Publish a release candidate, verify the multi-platform
  GHCR image in a clean Compose installation, and document any upgrade notes.

### Planned product work

- Keep the active view, query, filters, page, and selected document in the URL
  so a workspace can be refreshed, bookmarked, and shared without losing
  context.
- Make the review tag configurable instead of requiring the literal
  `Needs review` name, while retaining that name as the default.
- Add clear connection and permission recovery states without replacing usable
  document content with a generic error screen.
- Show upload progress and Paperless consumption status in a compact activity
  surface.
- Improve saved views with rename and delete actions and predictable persistence
  across schema changes.
- Add sanitized screenshots and a short first-run walkthrough to the public
  documentation.

### Architecture work that supports the release

- Extract stable workspace boundaries for navigation, document collection,
  preview, inspector, and upload. This should be an incremental component split,
  not a rewrite.
- Keep query translation and Paperless response mapping as independently tested
  adapter modules.
- Introduce a replaceable authentication-provider interface around the existing
  local account without adding multiple-user behavior yet.
- Add a fixture-backed integration test layer between route handlers and a
  Paperless-compatible HTTP server.

### v0.2.0 acceptance criteria

- The full repository check and browser workflow suite pass in CI.
- A 1,000+ document archive can be searched and filtered without client-side
  full-archive loading.
- Core workflows remain usable at desktop, tablet, and narrow mobile widths.
- Failed metadata updates roll back locally and explain how to retry.
- Upload processing failures are visible to the user.
- Authentication is enabled and documented in the recommended Compose example.
- The release image runs on both `linux/amd64` and `linux/arm64`.
- Compatibility is verified against the current supported paperless-ngx release.

## Explicitly not in v0.2.0

Keeping these out of the next release protects its reliability focus:

- Multiple Studio users or per-user Paperless permission mapping
- OIDC, SAML, LDAP, or passkey providers
- Document annotations or a custom PDF rendering engine
- Bulk editing and bulk review actions
- Full custom-field editing
- Native mobile applications

These are welcome design discussions, but implementation should wait until the
core workflow and authorization model are proven.

## Likely follow-up themes

### v0.3 — Workflow power

- Bulk selection and metadata actions
- Paperless custom fields
- Configurable review queues
- Server-backed saved views
- Document notes and audit history

### Toward v1.0

A 1.0 release should have a stable configuration contract, documented upgrades,
repeatable Paperless compatibility testing, complete critical-path browser
coverage, and at least one production-proven authentication deployment model.

## Contributing to the roadmap

Roadmap items describe outcomes, not ownership. Before starting a substantial
item, open an issue that proposes a small deliverable and identifies how it can
be tested. Maintainers may adjust scope as Paperless APIs and contributor needs
evolve.
