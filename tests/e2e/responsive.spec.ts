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
  const detailsTab = page.getByRole("tab", { name: "Details" });
  await expect(detailsTab).toBeVisible();
  await detailsTab.click();
  await expect(detailsTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("Correspondent")).toBeVisible();
  await page.getByRole("tab", { name: "Preview" }).click();
  await expect(
    page.getByTitle("Page 1 of Fixture invoice · June"),
  ).toBeVisible();
});
