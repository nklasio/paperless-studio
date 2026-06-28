export const AUTH_COOKIE_NAME = "paperless-studio-session";
export const AUTH_SESSION_SECONDS = 12 * 60 * 60;

export type AuthConfiguration = {
  username: string;
  password: string;
  secret: string;
};

export type AuthState =
  | { mode: "disabled" }
  | { mode: "invalid" }
  | { mode: "configured"; configuration: AuthConfiguration };

type SessionPayload = {
  username: string;
  expiresAt: number;
};

const encoder = new TextEncoder();

export function authenticationState(): AuthState {
  const username = process.env.PAPERLESS_STUDIO_USERNAME;
  const password = process.env.PAPERLESS_STUDIO_PASSWORD;
  const secret = process.env.PAPERLESS_STUDIO_SESSION_SECRET;
  const values = [username, password, secret];

  if (values.every((value) => !value)) return { mode: "disabled" };
  if (
    !username?.trim() ||
    !password ||
    !secret ||
    encoder.encode(secret).byteLength < 32
  ) {
    return { mode: "invalid" };
  }

  return {
    mode: "configured",
    configuration: { username: username.trim(), password, secret },
  };
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function decodeBase64Url(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(value)),
  );
}

function equalBytes(left: Uint8Array, right: Uint8Array) {
  if (left.byteLength !== right.byteLength) return false;
  let difference = 0;
  for (let index = 0; index < left.byteLength; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

async function secureEqual(left: string, right: string, secret: string) {
  const [leftDigest, rightDigest] = await Promise.all([
    hmac(left, secret),
    hmac(right, secret),
  ]);
  return equalBytes(leftDigest, rightDigest);
}

export async function credentialsAreValid(
  username: string,
  password: string,
  configuration: AuthConfiguration,
) {
  const [usernameMatches, passwordMatches] = await Promise.all([
    secureEqual(username, configuration.username, configuration.secret),
    secureEqual(password, configuration.password, configuration.secret),
  ]);
  return usernameMatches && passwordMatches;
}

export async function createSessionToken(
  configuration: AuthConfiguration,
  now = Date.now(),
) {
  const payload: SessionPayload = {
    username: configuration.username,
    expiresAt: now + AUTH_SESSION_SECONDS * 1000,
  };
  const encodedPayload = encodeBase64Url(
    encoder.encode(JSON.stringify(payload)),
  );
  const signature = encodeBase64Url(
    await hmac(encodedPayload, configuration.secret),
  );
  return `${encodedPayload}.${signature}`;
}

export async function sessionIsValid(
  token: string | undefined,
  configuration: AuthConfiguration,
  now = Date.now(),
) {
  if (!token) return false;
  const [encodedPayload, encodedSignature, extra] = token.split(".");
  if (!encodedPayload || !encodedSignature || extra) return false;

  try {
    const expectedSignature = await hmac(encodedPayload, configuration.secret);
    if (!equalBytes(expectedSignature, decodeBase64Url(encodedSignature))) {
      return false;
    }

    const payload = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(encodedPayload)),
    ) as Partial<SessionPayload>;
    return (
      payload.username === configuration.username &&
      typeof payload.expiresAt === "number" &&
      payload.expiresAt > now
    );
  } catch {
    return false;
  }
}

export async function authenticationDecision(request: {
  cookies: { get(name: string): { value: string } | undefined };
}) {
  const state = authenticationState();
  if (state.mode !== "configured") return state.mode;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  return (await sessionIsValid(token, state.configuration))
    ? "authorized"
    : "unauthorized";
}

export function safeReturnPath(value: string | null | undefined) {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
