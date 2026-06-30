import { expect, test } from "@playwright/test";

test("keeps core workflows available on mobile", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("studio");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByLabel("Open navigation").click();
  await expect(
    page.getByRole("button", { name: /New document/ }),
  ).toBeVisible();
  await page
    .locator("#primary-navigation")
    .getByLabel("Close navigation")
    .click();
  await page.getByText("Fixture invoice · June").first().click();
  await expect(page.getByLabel("Back to documents")).toBeVisible();
});
