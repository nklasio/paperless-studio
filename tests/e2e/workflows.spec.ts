import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page) {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Username").fill("studio");
  await page.getByLabel("Password").fill("test-password");
  await page.getByLabel("Password").press("Enter");
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  await expect(page.getByText("Fixture invoice · June").first()).toBeVisible();
}

test("login submits with Enter and workspace state survives reload", async ({
  page,
}) => {
  await signIn(page);
  await page.getByLabel("Search documents").fill("invoice");
  await expect(page).toHaveURL(/q=invoice/);
  await page.reload();
  await expect(page.getByLabel("Search documents")).toHaveValue("invoice");
});

test("edits and attaches custom fields", async ({ page }) => {
  await signIn(page);
  await page.getByText("Fixture invoice · June").first().click();
  const reference = page.getByRole("textbox", { name: "Reference" });
  await expect(reference).toHaveValue("INV-2026-06");
  await reference.fill("INV-UPDATED");
  await reference.blur();
  await expect(reference).toHaveValue("INV-UPDATED");
  await page.getByRole("button", { name: "Add", exact: true }).last().click();
  await page.getByRole("button", { name: /Amount monetary/ }).click();
  await expect(page.getByRole("textbox", { name: "Amount" })).toBeVisible();
});

test("tracks and remembers Paperless consumption", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: /New document/ }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "uploaded.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n%%EOF"),
  });
  await expect(page.getByText("Upload activity")).toBeVisible();
  await expect(page.getByText("Ready in Paperless")).toBeVisible({
    timeout: 12_000,
  });
  await page.reload();
  await page.getByRole("button", { name: /Activity/ }).click();
  await expect(page.getByText("uploaded.pdf")).toBeVisible();
});

test("has no serious automated accessibility findings", async ({ page }) => {
  await signIn(page);
  const results = await new AxeBuilder({ page })
    .exclude("iframe")
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    ),
  ).toEqual([]);
});
