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

test("records a partial payment against a selected obligation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /record payment/i }).click();
  await page.getByTestId("payment-form").getByLabel("Obligation").selectOption("33333333-3333-4333-8333-333333333333");
  await page.getByTestId("payment-form").getByLabel(/record a partial payment/i).check();
  await page.getByTestId("payment-form").getByLabel("Amount").fill("500.00");
  await page.getByTestId("payment-form").getByLabel("Payment date").fill("2026-08-17");
  await page.getByTestId("payment-form").getByRole("button", { name: /record payment/i }).click();
  await expect(page.getByText(/saved in demo mode|payment recorded/i)).toBeVisible();
});

test("shows edit controls for obligations, payments, income, and accounts", async ({ page }) => {
  await page.goto("/plan");
  await page.getByText("Edit obligation").first().click();
  await expect(page.getByRole("button", { name: /save obligation/i }).first()).toBeVisible();

  await page.goto("/");
  await page.getByText("Edit payment").first().click();
  await expect(page.getByRole("button", { name: /save payment/i }).first()).toBeVisible();

  await page.goto("/income");
  await page.getByText("Edit income entry").first().click();
  await expect(page.getByRole("button", { name: /save income entry/i }).first()).toBeVisible();
  await page.getByText("Edit recurring source").first().click();
  await expect(page.getByRole("button", { name: /save recurring source/i }).first()).toBeVisible();

  await page.goto("/settings");
  await page.getByText("Edit account").first().click();
  await expect(page.getByRole("button", { name: /save account/i }).first()).toBeVisible();
});

test("shows a forecast with breathing-room details", async ({ page }) => {
  await page.goto("/forecast?horizon=6&scenario=1000");
  await expect(page.getByRole("heading", { name: /look ahead/i })).toBeVisible();
  await expect(page.getByLabel("Monthly closing balance chart")).toBeVisible();
  await expect(page.getByText(/breathing-room milestones/i)).toBeVisible();
});
