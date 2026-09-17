import { expect, test } from "@playwright/test";

test.describe.configure({ timeout: 120_000 });

async function waitForVault(page: import("@playwright/test").Page) {
  await expect(page.getByTestId("vault-ready")).toHaveCount(1, { timeout: 20_000 });
}

test("create template, log with plates, survive refresh, complete, analytics update", async ({
  page,
}) => {
  await page.goto("/");
  await waitForVault(page);
  const welcome = page.getByTestId("onboarding-done");
  await expect(welcome.or(page.getByRole("heading", { name: "Today" }))).toBeVisible({ timeout: 20_000 });
  if (await welcome.isVisible()) await welcome.click();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("launch-Lower A")).toBeVisible({ timeout: 20_000 });

  await page.goto("/routines");
  await waitForVault(page);
  await expect(page.getByTestId("new-routine")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("new-routine").click();
  await expect(page).toHaveURL(/\/routines\/[0-9a-f-]+/i, { timeout: 20_000 });
  await expect(page.getByTestId("routine-name")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("routine-name").fill("E2E Strength");
  await page.getByTestId("routine-add-exercise").click();
  await page.getByTestId("exercise-search").fill("Back Squat");
  await page.getByTestId("pick-Back Squat").click();
  await page.getByTestId("save-routine").click();
  await expect(page.getByText("Template saved.")).toBeVisible({ timeout: 10_000 });

  await page.goto("/");
  await waitForVault(page);
  await expect(page.getByTestId("launch-E2E Strength")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("launch-E2E Strength").click();
  await expect(page.getByRole("heading", { name: "E2E Strength" })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Back Squat").first()).toBeVisible();

  await page.getByTestId("weight-0").fill("100");
  await page.getByTestId("reps-0").fill("5");
  await page.getByTestId("complete-set-0").click();
  await expect(page.getByTestId("complete-set-0")).toContainText("Done");

  await page.getByTestId("open-plates").click();
  await expect(page.getByText("Plate calculator")).toBeVisible();

  await page.reload();
  await waitForVault(page);
  await expect(page.getByRole("heading", { name: "E2E Strength" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("complete-set-0")).toContainText("Done");

  await page.getByTestId("finish-session").click();
  await page.getByTestId("confirm-finish").click();
  await expect(page.getByTestId("session-summary")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("pr-banner")).toBeVisible();

  await page.goto("/analytics");
  await waitForVault(page);
  await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("tonnage-table")).toContainText("Quads", { timeout: 15_000 });
});
