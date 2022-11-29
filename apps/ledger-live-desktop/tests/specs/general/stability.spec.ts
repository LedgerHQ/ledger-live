import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { AccountsPage } from "tests/models/AccountsPage";

test.use({ userdata: "bot-accounts" });

test("Stability of the app with numerous real accounts", async ({ page }) => {
  const layout = new Layout(page);
  const accountsPage = new AccountsPage(page);

  await test.step("visit portfolio page", async () => {
    await page.waitForTimeout(5000); // we're waiting a bit and we expect no crash has happened!
    await expect(layout.totalBalance).toBeVisible();
  });

  await test.step("visit accounts page", async () => {
    await layout.goToAccounts();
    await page.waitForTimeout(5000); // we're waiting a bit and we expect no crash has happened!
    await expect(accountsPage.addAccountButton).toBeVisible();
  });
});
