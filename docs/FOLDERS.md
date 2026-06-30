# Folder concept

Folders in Paperless Studio should be a virtual organization layer. They must
not change Paperless storage paths or move archive files on disk.

## Two folder types

### Manual folders

Manual folders are backed by ordinary Paperless tags under a configurable
prefix, defaulting to `Folder/`. Studio strips the prefix in its interface:

```text
Folder/Clients
Folder/Clients/Acme
Folder/Finance/2026
```

The slash-delimited tag name forms the hierarchy. Documents receive only the tag
for the folder to which they were assigned. Opening a parent folder queries for
the parent tag and every descendant tag, so `Clients` includes documents from
`Clients/Acme`.

Using tags keeps membership server-backed, permission-aware, searchable, and
visible to Paperless automation. Documents may belong to more than one manual
folder.

### Smart folders

Smart folders are backed by Paperless saved views. Their contents are calculated
from search and metadata filters and cannot be changed by dragging a document
into them. Studio displays a distinct smart-folder icon and offers **Edit
criteria** instead of membership controls.

## Interaction model

- The sidebar gains a collapsible **Folders** section with nested manual and
  smart folders.
- **Add to folder** adds a manual-folder tag without changing other folder
  memberships.
- **Move to folder** removes other tags under the configured folder prefix and
  adds the destination tag.
- Removing a document from a folder removes only that exact folder tag.
- Dragging onto a manual folder defaults to **Move**; holding
  <kbd>Option/Alt</kbd> changes the action to **Add**. A confirmation summary is
  shown for multi-document operations.
- Smart folders reject drops and explain that their contents are filter-driven.
- Folder URLs use the stable Paperless tag or saved-view ID rather than the
  display path.

## Folder management

Users can create a folder or subfolder, rename it, move it within the hierarchy,
and delete it. Rename and hierarchy changes update the affected Paperless tag
names, including descendants, after checking for naming conflicts.

Deleting a non-empty manual folder previews the number of affected documents and
requires explicit confirmation because deleting its Paperless tag removes that
membership. Deleting a parent does not silently delete descendants; the user
must move them, promote them, or explicitly include them.

Folder management respects Paperless tag and document permissions. Seeing a
folder never grants access to its documents, and Studio disables membership
changes when the configured account cannot edit the document or tag.

## Configuration and compatibility

```env
PAPERLESS_FOLDER_TAG_PREFIX=Folder/
```

The prefix must be non-empty and end in `/`. Existing tags outside the prefix
remain normal tags. Enabling folders requires no database or document migration;
existing prefixed tags appear automatically.

Folder names must be non-empty path segments without `/`, leading or trailing
whitespace, or control characters. Studio validates the full generated tag name
against Paperless limits before creating or renaming it.

## Deliberate boundaries

- Folders never map to Paperless storage paths.
- Folder membership does not imply exclusive ownership.
- v0.3 does not add filesystem browsing, folder-level ACL inheritance, or
  automatic conversion of existing tags.
- Offline demo mode uses an in-memory sample hierarchy; live folders always use
  Paperless as their source of truth.
