import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { AccountsPage } from "../../page/accounts.page";
import { Layout } from "../../component/layout.component";
import { AccountPage } from "../../page/account.page";
import { Modal } from "../../component/modal.component";
import { delegateModal } from "tests/page/modal/delegate.modal";

test.use({ userdata: "accountCosmos" });
let modalPage: Modal;
let delegate: delegateModal;

test.beforeEach(async ({ page }) => {
  const layout = new Layout(page);
  const accountPage = new AccountPage(page);
  await layout.goToAccounts();
  modalPage = new Modal(page);
  const accountsPage = new AccountsPage(page);
  await accountsPage.navigateToAccountByName("Cosmos 1");
  await accountPage.startStakingFlowFromMainStakeButton();
  delegate = new delegateModal(page);
});

test("Delegate flow using max amount", async ({ page }) => {
  await test.step("start the cosmos delegate flow", async () => {
    await expect.soft(modalPage.container).toHaveScreenshot(`earn-reward-pre-flow-page.png`);
  });

  await test.step("Toggle max amount to be filled in the amount field", async () => {
    // Continue from the earn-reward-modal
    await delegate.continue();
    // Continue from the delegate validator selection modal
    await delegate.continue();
    await page.waitForSelector("[data-testid='modal-max-checkbox']");
    await page.focus("[data-testid='modal-amount-field']");
    await delegate.toggleMaxAmount();
    const availableMaxAmount = await delegate.getSpendableBannerValue();
    await delegate.waitForCryptoAmountToBePopulated();
    const filledMaxAmount = await delegate.getCryptoAmount();
    expect(filledMaxAmount).toEqual(availableMaxAmount);
    await expect.soft(modalPage.container).toHaveScreenshot(`staking-max-amount-page.png`);
  });
});
