# Paperless Studio

A refined front end for Paperless-ngx built with Next.js, React, TypeScript,
Tailwind CSS, and small shadcn-style UI primitives.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The interface includes
representative data when no Paperless instance is configured.

## Connect Paperless-ngx

Set these values in `.env.local`:

```env
PAPERLESS_URL=https://paperless.example.com
PAPERLESS_TOKEN=your_api_token
```

The token stays server-side. Next.js route handlers proxy document search,
metadata updates, previews, and uploads so browser clients never receive the
Paperless API credential.

## Included workflows

- Inbox and recently added views
- Full-text style document filtering
- Document detail workspace and paper preview
- Correspondent, document type, and tag editing
- Drag-and-drop upload
- Needs-review queue with optimistic review actions
- Responsive navigation and document inspector
- Keyboard shortcuts: `⌘K` search and `⌘U` upload
