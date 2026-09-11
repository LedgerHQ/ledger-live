import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../component/layout.component";
import { AccountsPage } from "../../page/accounts.page";
import { AccountPage } from "../../page/account.page";

test.use({
  userdata: "1AccountNEAR",
  featureFlags: {
    stakePrograms: {
      enabled: true,
      params: {
        list: ["near"],
        redirects: {},
      },
    },
  },
});

test.describe("NEAR account UI (generic framework)", () => {
  test("account page renders without crash and shows balance footer @smoke", async ({ page }) => {
    const layout = new Layout(page);
    const accountsPage = new AccountsPage(page);
    const accountPage = new AccountPage(page);

    await layout.goToAccounts();
    await accountsPage.navigateToAccountByName("NEAR 1");

    // Account page loaded — balance area visible
    await expect(
      page.locator("text=Available balance").or(page.locator("text=Available Balance")),
    ).toBeVisible({ timeout: 15000 });

    // Balance summary footer — storage usage / minimum balance label always shown
    await expect(page.locator("text=Minimum balance").or(page.locator("text=Storage"))).toBeVisible(
      { timeout: 10000 },
    );

    // Earn/Stake button must be present for a NEAR account
    await expect(page.getByRole("button", { name: /Earn|Stake/i }).first()).toBeVisible({
      timeout: 5000,
    });

    // Send button present
    await expect(page.getByRole("button", { name: "Send" })).toBeVisible({ timeout: 5000 });

    // No uncaught console errors (framework invariant violations would show here)
    const errors: string[] = [];
    page.on("pageerror", err => errors.push(err.message));
    await page.waitForTimeout(2000);
    const invariantErrors = errors.filter(
      e => e.includes("Invariant failed") || e.includes("nearResources"),
    );
    expect(invariantErrors, `Unexpected errors: ${invariantErrors.join(", ")}`).toHaveLength(0);
  });

  test("operation list renders and shows NEAR transactions @smoke", async ({ page }) => {
    const layout = new Layout(page);
    const accountsPage = new AccountsPage(page);
    const accountPage = new AccountPage(page);

    await layout.goToAccounts();
    await accountsPage.navigateToAccountByName("NEAR 1");

    await accountPage.scrollToOperations();

    // Should have at least one operation row
    const opRows = page.locator("[data-testid^='operation-row']");
    await expect(opRows.first()).toBeVisible({ timeout: 10000 });
  });
});
