# Security policy

## Supported versions

Paperless Studio is currently pre-release software. Security fixes are applied
to the latest commit on the default branch.

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability.

Use GitHub's private vulnerability reporting feature for this repository. If
that feature is unavailable, contact a maintainer privately through their public
GitHub profile and include only enough information to establish a safe reporting
channel.

Please include:

- The affected route or workflow
- Reproduction steps using non-sensitive test data
- The security impact
- Any suggested mitigation

Do not include live API tokens, private documents, or personal information.

## Deployment model

Paperless Studio stores no Paperless credential in browser code. Server-side
route handlers use `PAPERLESS_TOKEN` to communicate with Paperless. Upload and
metadata mutation routes reject cross-origin browser requests.

The optional built-in local account protects Studio with a signed, HTTP-only
session. It does not reproduce Paperless user sessions: every signed-in user
still acts with the configured token's permissions. Operators should:

- Enable the local account or use an authenticated reverse proxy
- Keep Studio on a trusted network
- Use HTTPS at the public edge
- Use a dedicated, least-privilege Paperless account
- Rotate the API token, password, and session secret if they may be exposed
- Avoid logging environment variables or request headers

See [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md) for configuration and
limitations.
