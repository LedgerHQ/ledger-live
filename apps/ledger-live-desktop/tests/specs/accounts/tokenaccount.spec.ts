import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { AccountsPage } from "../../models/AccountsPage";
import { AccountPage } from "../../models/AccountPage";

test.use({ userdata: "accountEthToken" });

test(`Open token account`, async ({ page }) => {
  const layout = new Layout(page);
  const accountsPage = new AccountsPage(page);
  const accountPage = new AccountPage(page);

  await test.step(`Open account`, async () => {
    await layout.goToAccounts();
    await accountsPage.goToAccount("Ethereum 1");
  });

  await test.step(`Open token account`, async () => {
    await accountPage.goToTokenAccount("USD Coin");
  });

  await test.step(`Verify token account is displayed`, async () => {
    await expect.soft(page).toHaveScreenshot(`token-success.png`);
  });
});
