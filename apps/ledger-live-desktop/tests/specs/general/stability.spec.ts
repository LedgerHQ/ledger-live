import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { AccountsPage } from "../../models/AccountsPage";

test.use({ userdata: "bot-accounts" });

// skipping as this as it's not valid for functional UI tests
test.skip("Stability of the app with numerous real accounts", async ({ page }) => {
  const layout = new Layout(page);
  const accountsPage = new AccountsPage(page);

  await test.step("visit portfolio page", async () => {
    await expect(layout.topbarSynchronizeButton).toBeVisible();
    await expect(layout.topbarSynchronizeButton).toHaveText("Synchronized");
  });

  await test.step("visit accounts page", async () => {
    await layout.goToAccounts();
    await expect(accountsPage.addAccountButton).toBeVisible();
    await expect(layout.topbarSynchronizeButton).toHaveText("Synchronized");
  });
});
