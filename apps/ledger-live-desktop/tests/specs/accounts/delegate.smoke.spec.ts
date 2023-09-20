import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { AccountsPage } from "../../models/AccountsPage";
import { Layout } from "../../models/Layout";
import { AccountPage } from "../../models/AccountPage";
import { Modal } from "../../models/Modal";

test.use({ userdata: "accountCosmos" });
let modalPage: Modal;

test.beforeEach(async ({ page }) => {
  const layout = new Layout(page);
  const accountPage = new AccountPage(page);
  await layout.goToAccounts();
  modalPage = new Modal(page);
  const accountsPage = new AccountsPage(page);
  await accountsPage.navigateToAccountByName("Cosmos 1");
  await accountPage.startCosmosStakingFlow();
});

test.describe("Delegate flow", async () => {
  test("Delegate flow using max amount", async () => {
    await test.step("start the cosmos delegate flow", async () => {
      await expect.soft(modalPage.container).toHaveScreenshot(`earn-reward-pre-flow-page.png`);
    });

    await test.step("Check Ledger is the provider by default", async () => {
      await modalPage.continue();
      const defaultprovider = await modalPage.getTitleProvider();
      expect(defaultprovider).toEqual("Ledger");
    });

    await test.step("Toggle max amount to be filled in the amount field", async () => {
      await modalPage.continueDelegate();
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
      await modalPage.openSearchProviderModal();
      await modalPage.inputProvider(providerResearched);
      await modalPage.selectProvider(0);
      const providerSelected = await modalPage.getTitleProvider();
      expect(providerSelected).toEqual(providerResearched);
    });
  });
});
