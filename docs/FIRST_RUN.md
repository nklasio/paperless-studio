# First run

Paperless Studio sits beside an existing paperless-ngx installation. The
shortest path to a dependable setup is:

1. Create a dedicated Paperless user with only the permissions needed by the
   people using Studio.
2. Create an API token for that account.
3. Add the Studio service from the README to the same Compose network.
4. Configure Studio's local username, password, and generated session secret.
5. Open Studio and confirm the sidebar reports a connected workspace.

## Your first review

Open **Needs review**, choose a document, verify its correspondent, type, date,
tags, and custom fields, then select **Mark as reviewed**. Studio removes the
configured review tag while Paperless remains responsible for the document, OCR,
permissions, and archive.

## Your first upload

Select **New document** or press <kbd>⌘/Ctrl</kbd>+<kbd>U</kbd>. The Activity
surface distinguishes transfer from Paperless consumption: queued and processing
documents are not presented as complete until Paperless reports a successful
task. Activity is remembered in this browser until dismissed.

## Recovery

- **Read-only document:** grant the configured Paperless account change
  permission if editing is required.
- **Paperless rejected the token:** replace `PAPERLESS_TOKEN` and restart
  Studio.
- **Upload paused:** open Activity and retry the status check. The Paperless
  task continues even while Studio is closed.
- **Authentication configuration warning:** set all three Studio authentication
  variables, including a session secret of at least 32 characters.
