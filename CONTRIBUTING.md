# Contributing to Paperless Studio

Thanks for helping make Paperless Studio better. The project aims to stay easy
to understand, pleasant to use, and straightforward to extend.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

- Search existing issues before opening a new one.
- Open an issue before starting a large feature or architectural change.
- Keep pull requests focused. Small changes are easier to review and ship.
- Never include document contents, API tokens, or other private Paperless data
  in issues, screenshots, fixtures, or commits.

## Development setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Paperless is optional for UI-only work. Without both environment variables the
app uses mock documents. For integration work, point `.env.local` at a test
Paperless instance rather than a server containing sensitive documents.

## Making changes

1. Create a branch from the current default branch.
2. Add or update types before passing new data through the UI.
3. Keep Paperless credentials and API calls in server-side route handlers.
4. Preserve the mock-data path for contributors without Paperless.
5. Check keyboard access, focus states, overflow, and narrow viewports for UI
   changes.
6. Update documentation when behavior or setup changes.

The architecture guide in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
explains where common changes belong.

## Checks

Run the full check before opening a pull request:

```bash
npm run check
```

For visual changes, also test list and grid views, a long document title, an
empty result, and both desktop and mobile layouts.

## Commits and pull requests

Use [Conventional Commits](https://www.conventionalcommits.org/) where possible:

```text
feat: add correspondent search
fix: preserve filters while paging
docs: explain reverse proxy setup
```

A pull request should explain:

- What changed and why
- How it was tested
- Any Paperless version or configuration assumptions
- Screenshots or a short recording for visible UI changes

By contributing, you agree that your contribution is licensed under the
project's GNU General Public License v3.0.
