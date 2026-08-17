import { expect, test } from "@playwright/test";

test("sign-in screen is available", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /private hinga room/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /send magic link/i })).toBeVisible();
});

test("adds an obligation through the demo-capable form", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /add obligation/i }).click();
  await page.getByTestId("obligation-form").getByLabel("Name").fill("Test bill");
  await page.getByTestId("obligation-form").getByLabel("Amount").fill("1200.00");
  await page.getByTestId("obligation-form").getByLabel("Start date").fill("2026-08-01");
  await page.getByTestId("obligation-form").getByLabel("Due day").fill("28");
  await page.getByTestId("obligation-form").getByRole("button", { name: /add obligation/i }).click();
  await expect(page.getByText(/saved in demo mode|obligation added/i)).toBeVisible();
});

test("adds expected income through the demo-capable form", async ({ page }) => {
  await page.goto("/income");
  await page.getByTestId("income-form").getByLabel("Amount").fill("2500.00");
  await page.getByTestId("income-form").getByLabel("Expected date").fill("2026-08-29");
  await page.getByTestId("income-form").getByLabel("Source or note").fill("Side project");
  await page.getByTestId("income-form").getByRole("button", { name: /add income/i }).click();
  await expect(page.getByText(/saved in demo mode|income added/i)).toBeVisible();
});

test("shows a forecast with breathing-room details", async ({ page }) => {
  await page.goto("/forecast?horizon=6&scenario=1000");
  await expect(page.getByRole("heading", { name: /look ahead/i })).toBeVisible();
  await expect(page.getByLabel("Monthly closing balance chart")).toBeVisible();
  await expect(page.getByText(/breathing-room milestones/i)).toBeVisible();
});
