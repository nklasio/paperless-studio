import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("capture the sanitized fixture workspace", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("studio");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Fixture invoice · June").first()).toBeVisible();
  await expect(page.locator(".document-list")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await page.waitForTimeout(250);
  await mkdir("docs/images", { recursive: true });
  await page.screenshot({
    path: "docs/images/workspace.png",
    fullPage: true,
  });
});
