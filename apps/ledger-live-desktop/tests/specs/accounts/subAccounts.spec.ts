import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { AccountsPage } from "../../page/accounts.page";
import { AddAccountModal } from "../../page/modal/add.account.modal";
import { ReceiveModal } from "../../page/modal/receive.modal";
import { Layout } from "../../component/layout.component";
import { DeviceAction } from "../../models/DeviceAction";
import { PortfolioPage } from "../../page/portfolio.page";

test.use({ userdata: "skip-onboarding" });

// FIXME: Sometimes first selected account is not the same, it should be the biggest balance.
test.fixme("subAccounts @smoke", async ({ page }) => {
  const addAccountModal = new AddAccountModal(page);
  const accountsPage = new AccountsPage(page);
  const receiveModal = new ReceiveModal(page);
  const deviceAction = new DeviceAction(page);
  const layout = new Layout(page);
  const portfolioPage = new PortfolioPage(page);

  // When parent is missing
  await test.step("should find token in the currencies list", async () => {
    await portfolioPage.openAddAccountModal();
    await addAccountModal.select("chainlink");
    await expect.soft(addAccountModal.container).toHaveScreenshot("subAccount-noParent.png");
  });

  await test.step("should scan parent", async () => {
    await addAccountModal.continue();
    await deviceAction.openApp();
    await addAccountModal.waitForSync();
    await expect(addAccountModal.addAccountsButton).toBeVisible();
  });

  await test.step("should add parent", async () => {
    await expect.soft(addAccountModal.container).toHaveScreenshot("parent-addAccount-result.png");
    await addAccountModal.addAccounts();
    await addAccountModal.done();
  });

  // When parent is present but subAccount is missing
  await test.step("should find token in currencies list", async () => {
    await layout.goToAccounts();
    await accountsPage.openAddAccountModal();
    await addAccountModal.select("must");
    await expect.soft(addAccountModal.container).toHaveScreenshot("parent-exists.png");
  });

  await test.step("should receive on parent", async () => {
    await receiveModal.continue();
    await expect.soft(addAccountModal.container).toHaveScreenshot("select-parent.png");
    await receiveModal.continue();
  });

  await test.step("should show parent address", async () => {
    await receiveModal.skipDevice();
    // This assertion fails because the first selected account changes (from Ethereum 1 to Ethereum 2)
    await expect.soft(addAccountModal.container).toHaveScreenshot("parent-address.png");
    await receiveModal.continue();
    await receiveModal.continue();
  });

  // When subAccount is present
  await test.step("should find token in currencies list", async () => {
    await layout.goToAccounts();
    await accountsPage.openAddAccountModal();
    await addAccountModal.select("usd coin");
    await expect.soft(addAccountModal.container).toHaveScreenshot("subAccount-exist.png");
  });

  await test.step("should receive on subAccount", async () => {
    await receiveModal.continue();
    // This assertion fails because the first selected account changes (from Ethereum 1 to Ethereum 2)
    await expect.soft(addAccountModal.container).toHaveScreenshot("select-account.png");
  });

  await test.step("should show subAccount address", async () => {
    await receiveModal.continue();
    await receiveModal.skipDevice();
    // This assertion fails because the first selected account changes (from Ethereum 1 to Ethereum 2)
    await expect.soft(addAccountModal.container).toHaveScreenshot("subAccount-address.png");
    await receiveModal.continue();
    await receiveModal.continue();
  });
});
