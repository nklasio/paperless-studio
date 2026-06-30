"use client";

import { FormEvent, KeyboardEvent, useState } from "react";

export function LoginForm({ returnPath }: { returnPath: string }) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not sign in.");
        return;
      }
      window.location.assign(returnPath);
    } catch {
      setError("Could not reach Paperless Studio. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function submitOnEnter(event: KeyboardEvent<HTMLFormElement>) {
    if (
      event.key !== "Enter" ||
      event.nativeEvent.isComposing ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }
    event.preventDefault();
    event.currentTarget.requestSubmit();
  }

  return (
    <form className="login-form" onSubmit={signIn} onKeyDown={submitOnEnter}>
      <label>
        <span>Username</span>
        <input
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          required
          autoFocus
        />
      </label>
      <label>
        <span>Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {error ? (
        <p className="login-error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
