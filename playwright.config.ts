import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /responsive\.spec\.ts/,
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
      testMatch: /responsive\.spec\.ts/,
    },
  ],
  webServer: [
    {
      command: "node tests/fixtures/paperless-server.mjs",
      port: 4010,
      reuseExistingServer: !process.env.CI,
    },
    {
      command:
        "NEXT_DIST_DIR=.next-e2e PAPERLESS_URL=http://127.0.0.1:4010 PAPERLESS_TOKEN=fixture-token PAPERLESS_PUBLIC_URL=http://127.0.0.1:4010 PAPERLESS_STUDIO_USERNAME=studio PAPERLESS_STUDIO_PASSWORD=test-password PAPERLESS_STUDIO_SESSION_SECRET=fixture-session-secret-with-more-than-32-characters npm run dev -- --port 3100",
      port: 3100,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
