import type { AuthConfiguration, AuthState } from "@/lib/auth";
import { credentialsAreValid } from "@/lib/auth";

export type AuthenticationIdentity = { username: string };

export interface AuthenticationProvider {
  readonly kind: "local";
  authenticate(
    username: string,
    password: string,
  ): Promise<AuthenticationIdentity | null>;
}

class LocalAuthenticationProvider implements AuthenticationProvider {
  readonly kind = "local" as const;

  constructor(private configuration: AuthConfiguration) {}

  async authenticate(username: string, password: string) {
    return (await credentialsAreValid(username, password, this.configuration))
      ? { username: this.configuration.username }
      : null;
  }
}

export function authenticationProvider(state: AuthState) {
  return state.mode === "configured"
    ? new LocalAuthenticationProvider(state.configuration)
    : null;
}
