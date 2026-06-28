import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  credentialsAreValid,
  safeReturnPath,
  sessionIsValid,
  type AuthConfiguration,
} from "./auth";

const configuration: AuthConfiguration = {
  username: "studio",
  password: "correct horse battery staple",
  secret: "a-session-secret-that-is-longer-than-32-characters",
};

describe("local authentication", () => {
  it("accepts only the configured credentials", async () => {
    await expect(
      credentialsAreValid("studio", configuration.password, configuration),
    ).resolves.toBe(true);
    await expect(
      credentialsAreValid("studio", "wrong", configuration),
    ).resolves.toBe(false);
  });

  it("creates a signed session that expires", async () => {
    const token = await createSessionToken(configuration, 1_000);

    await expect(sessionIsValid(token, configuration, 2_000)).resolves.toBe(
      true,
    );
    await expect(
      sessionIsValid(token, configuration, 50_000_000),
    ).resolves.toBe(false);
  });

  it("rejects a modified session", async () => {
    const token = await createSessionToken(configuration);
    const [payload, signature] = token.split(".");

    await expect(
      sessionIsValid(`${payload}x.${signature}`, configuration),
    ).resolves.toBe(false);
  });

  it("only redirects to local application paths", () => {
    expect(safeReturnPath("/documents/42?from=login")).toBe(
      "/documents/42?from=login",
    );
    expect(safeReturnPath("https://attacker.example")).toBe("/");
    expect(safeReturnPath("//attacker.example")).toBe("/");
  });
});
