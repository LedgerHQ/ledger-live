import { by, element, expect, waitFor } from "detox";
import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "../../helpers/commonHelpers";

export default class PortfolioPage {
  baseLink = "portfolio";
  zeroBalance = "$0.00";
  graphCardBalanceId = "graphCard-balance";
  assetBalanceId = "asset-balance";
  assetsListId = "AssetsList";
  readOnlyItemsId = "PortfolioReadOnlyItems";
  accountsListView = "PortfolioAccountsList";
  managerTabBarId = "TabBarManager";
  seeAllTransactionButton = "portfolio-seeAll-transaction";
  transactionAmountId = "portfolio-operation-amount";
  emptyPortfolioListId = "PortfolioEmptyList";
  emptyPortfolioList = () => getElementById(this.emptyPortfolioListId);
  portfolioSettingsButtonId = "topbar-settings";
  portfolioSettingsButton = () => getElementById(this.portfolioSettingsButtonId);
  addAccountCta = "add-account-cta";
  // Match the operation row by its amount text rather than position 0:
  // background-synced incoming ops from other accounts can sit above the just-completed one.
  transactionByAmount = (amount: string) =>
    element(by.id(this.transactionAmountId).and(by.text(amount)));
  assetItemId = (currencyName: string) => `assetItem-${currencyName}`;
  allocationSectionTitleId = "portfolio-allocation-section";

  @Step("Navigate to Settings")
  async navigateToSettings() {
    await tapByElement(this.portfolioSettingsButton());
  }

  async waitForPortfolioPageToLoad() {
    await waitForElementById(this.portfolioSettingsButtonId, 120000);
  }

  async expectPortfolioEmpty() {
    await expect(this.portfolioSettingsButton()).toBeVisible();
    await expect(this.emptyPortfolioList()).toBeVisible();
  }

  async expectPortfolioReadOnly() {
    await expect(this.portfolioSettingsButton()).toBeVisible();
    await waitForElementById(this.readOnlyItemsId);
    jestExpect(await getTextOfElement(this.graphCardBalanceId)).toBe(this.zeroBalance);
    for (let index = 0; index < 4; index++)
      jestExpect(await getTextOfElement(this.assetBalanceId, index)).toBe(this.zeroBalance);
  }

  @Step("Open Portfolio via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  async openMyLedger() {
    await tapById(this.managerTabBarId);
  }

  @Step("Click on Add account button in portfolio")
  async addAccount() {
    await scrollToId(this.addAccountCta, this.emptyPortfolioListId);
    await tapById(this.addAccountCta);
  }

  async scrollToTransactions() {
    await scrollToId(this.seeAllTransactionButton, this.accountsListView);
  }

  @Step("Expect Portfolio with accounts")
  async expectPortfolioWithAccounts() {
    await expect(getElementById(this.accountsListView)).toBeVisible();
  }

  async expectLastTransactionAmount(amount: string) {
    await waitFor(this.transactionByAmount(amount)).toBeVisible().withTimeout(60000);
  }

  async openLastTransaction(amount: string) {
    await tapByElement(this.transactionByAmount(amount));
  }

  @Step("Go to asset's accounts from portfolio")
  async goToAccounts(currencyName: string) {
    await scrollToId(this.assetItemId(currencyName), this.accountsListView);
    await tapById(this.assetItemId(currencyName));
  }
}
