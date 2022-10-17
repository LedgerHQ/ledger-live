import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { AccountPage } from "../../models/AccountPage";
import { Modal } from "../../models/Modal";

test.use({ userdata: "1AccountBTC1AccountETH" });

test("removeAccount", async ({ page }) => {
  const layout = new Layout(page);
  const accountPage = new AccountPage(page);
  const modal = new Modal(page);

  await test.step("go to accounts", async () => {
    await layout.goToAccounts();
    await expect.soft(page).toHaveScreenshot("accounts.png");
  });

  await test.step("select first account and remove it", async () => {
    // Page Accounts
    await accountPage.clickFirstAccount();
    await accountPage.settingsButton.click();
    await accountPage.removeButton.click();
    await modal.confirmButton.click();
    await expect.soft(page).toHaveScreenshot("first-account-removed.png");
  });
});
