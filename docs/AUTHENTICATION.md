# Authentication

Paperless Studio includes an optional local authentication boundary for
single-user and household installations. It is deliberately independent from the
Paperless API token so browser users never receive that credential.

## Local account

Set all three variables:

```env
PAPERLESS_STUDIO_USERNAME=studio
PAPERLESS_STUDIO_PASSWORD=replace-with-a-strong-password
PAPERLESS_STUDIO_SESSION_SECRET=replace-with-at-least-32-random-characters
```

Generate a session secret with:

```bash
openssl rand -hex 32
```

When all variables are absent, authentication is disabled to preserve the
zero-configuration contributor demo. A partial or invalid configuration fails
closed with HTTP 503.

## Security model

- Credentials are compared using fixed-length HMAC digests.
- Successful login creates an HMAC-signed, HTTP-only, same-site session cookie.
- Sessions expire after 12 hours and are invalidated when the username or
  session secret changes.
- Login attempts have a small in-process rate limit suitable for the default
  single-container deployment.
- Next.js Proxy performs the early redirect or API rejection.
- Document API handlers verify the session again at the data boundary.
- Login and logout mutations retain the same-origin checks used by document
  mutations.

The password necessarily exists in the server process environment. Protect
access to the Docker host and Compose configuration as carefully as the
Paperless API token. HTTPS should terminate at a trusted reverse proxy for
remote access so the session cookie receives its `Secure` attribute.

## Intended evolution

The UI and Paperless adapter depend only on the result of Studio authentication,
not on its credential source. A future authentication provider can therefore
replace the local account with OIDC, an authenticated reverse proxy header, or
multiple persisted users while retaining the same session boundary.

Before adding multiple users, define how each Studio identity maps to a
Paperless identity. The current shared Paperless token means every Studio user
would still have the same Paperless permissions, so a multi-user login screen
alone would not provide meaningful authorization isolation.
