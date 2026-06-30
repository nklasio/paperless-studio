import { defineConfig, devices } from "@playwright/test";
import baseConfig from "./playwright.config";

export default defineConfig({
  ...baseConfig,
  testDir: "./tests/screenshots",
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
