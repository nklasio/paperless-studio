import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { authenticationState, safeReturnPath } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const state = authenticationState();
  if (state.mode === "disabled") redirect("/");
  const returnPath = safeReturnPath((await searchParams).next);

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="login-eyebrow">Paperless Studio</p>
        <h1 id="login-title">
          {state.mode === "invalid"
            ? "Authentication needs attention"
            : "Welcome back"}
        </h1>
        {state.mode === "invalid" ? (
          <p className="login-description">
            Set a username, password, and session secret of at least 32
            characters, then restart Studio.
          </p>
        ) : (
          <>
            <p className="login-description">
              Sign in to open your document workspace.
            </p>
            <LoginForm returnPath={returnPath} />
          </>
        )}
      </section>
    </main>
  );
}
