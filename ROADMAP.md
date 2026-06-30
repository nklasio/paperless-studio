# Roadmap

Paperless Studio is working toward a dependable daily-driver experience while
remaining a small, approachable companion to paperless-ngx. The roadmap favors
trustworthy document workflows over broad feature parity with the upstream
Paperless interface.

## Current milestone: v0.2.0 — Daily-driver reliability

The v0.2 implementation adds resilient API contracts, persistent upload
activity, restorable workspace URLs, configurable review tags, custom-field
editing, permission-aware recovery, and fixture-backed browser tests.

Before the stable tag, the release still needs a release-candidate Compose
rehearsal on `linux/amd64` and `linux/arm64`, plus the documented manual
keyboard, 200% zoom, reduced-motion, and screen-reader checks.

## Next release: v0.3.0 — Workflow power

The goal of v0.3 is to make recurring organization work fast without turning
Studio into a second Paperless administration interface. A user should be able
to select a meaningful result set, apply safe metadata changes, and return to a
server-backed queue from any browser.

### Product tracks

- **Bulk selection and safe actions:** Add keyboard-accessible selection in list
  and grid views, select-page and select-all-results affordances, and bulk
  correspondent, document type, tag, custom-field, and review actions. Preview
  the affected count before applying changes and report partial failures.
- **Paperless saved views:** Read, create, rename, update, and delete saved
  views through the Paperless API. Offer a one-time import for Studio's local
  v0.2 views and retain local views only in demo mode.
- **Virtual folders:** Add a nested Finder-like navigation layer with manual
  folders backed by prefixed Paperless tags and smart folders backed by saved
  views. Folder actions never modify Paperless storage paths. See the
  [folder concept](docs/FOLDERS.md).
- **Review queue builder:** Let saved views become named review queues with
  configurable completion actions. The default remains removing the configured
  review tag; additional queues may remove or add specific tags.
- **Custom-field filtering:** Add type-aware filters for text, URL, date,
  boolean, numeric, monetary, select, and field-presence queries while keeping
  filtering server-side.
- **Document notes and activity:** Display and create Paperless document notes,
  and show a compact session activity history for Studio-initiated metadata and
  review changes. Do not claim a complete audit log when Paperless cannot
  provide one.

### Reliability and architecture

- Add a same-origin bulk-action route that validates requested document IDs,
  action types, permissions, and a conservative maximum batch size before
  forwarding to Paperless.
- Model bulk operations as visible tasks with pending, completed, partially
  completed, and failed states; never report success from the initial enqueue
  response alone.
- Extend capability data so unavailable actions are disabled before selection,
  while the server remains authoritative for every mutation.
- Keep document result pagination server-side. “All results” selection stores
  the query definition plus explicit exclusions instead of loading every ID into
  the browser.
- Isolate saved-view translation, custom-field query construction, notes, and
  bulk-task mapping as independently tested adapter modules.

### Delivery slices

1. Paperless saved-view adapter, local-view import, and demo-mode fallback.
2. Manual and smart folder adapters, hierarchy navigation, and permission-safe
   membership actions.
3. Selection model and accessible list/grid interaction without mutations.
4. Bulk metadata/review API, confirmation UI, task activity, and rollback.
5. Type-aware custom-field filters and shareable URL serialization.
6. Document notes, session activity, browser coverage, and release polish.

Each slice should be a focused issue and pull request that leaves the full
repository check green.

### v0.3.0 acceptance criteria

- A query spanning 10,000+ documents can select all results without downloading
  the full archive to the browser.
- Bulk actions clearly distinguish complete, partial, failed, and still-running
  outcomes and never silently lose failures.
- Saved views and review queues survive browser changes because Paperless is the
  source of truth.
- Manual and smart folders survive browser changes, aggregate descendants
  correctly, and never alter Paperless storage paths.
- Custom-field filters round-trip through the URL and produce the same Paperless
  query after refresh.
- Selection, confirmation, and recovery are usable with keyboard, touch, 200%
  zoom, reduced motion, and a screen reader.
- Fixture-backed browser tests cover bulk success, partial failure, stale
  permissions, saved-view migration, queue completion, notes, and narrow mobile
  layouts.
- The release image is rehearsed against the current supported paperless-ngx API
  on both published architectures.

## Explicitly not in v0.3.0

- Bulk deletion, PDF merging, splitting, rotation, or reprocessing
- Multiple Studio users or per-user Paperless token mapping
- OIDC, SAML, LDAP, passkeys, or trusted-proxy authentication
- Paperless workflow, mail-rule, user, group, or permission administration
- Document annotations or a custom PDF renderer
- Native mobile applications

### Toward v1.0

A 1.0 release should have a stable configuration contract, documented upgrades,
repeatable Paperless compatibility testing, complete critical-path browser
coverage, and at least one production-proven authentication deployment model.

## Contributing to the roadmap

Roadmap items describe outcomes, not ownership. Before starting a substantial
item, open an issue that proposes a small deliverable and identifies how it can
be tested. Maintainers may adjust scope as Paperless APIs and contributor needs
evolve.
