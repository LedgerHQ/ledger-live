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

test("Delegate flow using max amount", async () => {
  await test.step("start the cosmos delegate flow", async () => {
    await expect.soft(modalPage.container).toHaveScreenshot(`earn-reward-pre-flow-page.png`);
  });

  await test.step("Check Ledger is the provider by default", async () => {
    await modalPage.continue();
    const defaultprovider = await delegate.getTitleProvider(1);
    expect(defaultprovider).toEqual("Ledger");
  });

  await test.step("Toggle max amount to be filled in the amount field", async () => {
    await delegate.continueDelegate();
    await modalPage.toggleMaxAmount();
    const availableMaxAmount = await modalPage.getSpendableBannerValue();
    const filledMaxAmount = await modalPage.getCryptoAmount();
    expect(filledMaxAmount).toEqual(availableMaxAmount);
    await expect.soft(modalPage.container).toHaveScreenshot(`staking-max-amount-page.png`);
  });
});

test("The user search and select a provider", async () => {
  await test.step("open the provider search modal", async () => {
    await modalPage.continue();
    await expect.soft(modalPage.container).toHaveScreenshot(`provider-search-page.png`);
  });

  await test.step("search for new provider", async () => {
    const providerResearched = "Figment";
    await delegate.openSearchProviderModal();
    await delegate.inputProvider(providerResearched);
    await delegate.selectProviderOnRow(1);
    const providerSelected = await delegate.getTitleProvider(1);
    expect(providerSelected).toEqual(providerResearched);
  });
});
