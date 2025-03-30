import { openDeeplink } from "../../helpers/commonHelpers";

export default class PortfolioPage {
  baseLink = "portfolio";
  zeroBalance = "$0.00";
  graphCardBalanceId = "graphCard-balance";
  assetBalanceId = "asset-balance";
  readOnlyItemsId = "PortfolioReadOnlyItems";
  accountsListView = "PortfolioAccountsList";
  receiveButton = "receive-button";
  managerTabBarId = "TabBarManager";
  seeAllTransactionButton = "portfolio-seeAll-transaction";
  transactionAmountId = "portfolio-operation-amount";
  emptyPortfolioListId = "PortfolioEmptyList";
  emptyPortfolioList = () => getElementById(this.emptyPortfolioListId);
  portfolioSettingsButtonId = "settings-icon";
  portfolioSettingsButton = () => getElementById(this.portfolioSettingsButtonId);
  sendMenuButton = () => getElementById("send-button");
  earnButton = () => getElementById("tab-bar-earn");
  addAccountCta = "add-account-cta";
  lastTransactionAmount = () => getElementById(this.transactionAmountId, 0);
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
    await detoxExpect(this.portfolioSettingsButton()).toBeVisible();
    await detoxExpect(this.emptyPortfolioList()).toBeVisible();
  }

  async receive() {
    await tapById(this.receiveButton);
  }

  async expectPortfolioReadOnly() {
    await detoxExpect(this.portfolioSettingsButton()).toBeVisible();
    await waitForElementById(this.readOnlyItemsId);
    jestExpect(await getTextOfElement(this.graphCardBalanceId)).toBe(this.zeroBalance);
    for (let index = 0; index < 4; index++)
      jestExpect(await getTextOfElement(this.assetBalanceId, index)).toBe(this.zeroBalance);
  }

  @Step("Open Portfolio via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
    await waitForElementById(this.portfolioSettingsButtonId); // Issue with RN75 : QAA-370
  }

  async openMyLedger() {
    await tapById(this.managerTabBarId);
  }

  async openEarnApp() {
    await tapByElement(this.earnButton());
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
    await detoxExpect(getElementById(this.accountsListView)).toBeVisible();
  }

  async expectLastTransactionAmount(amount: string) {
    await detoxExpect(this.lastTransactionAmount()).toHaveText(amount);
  }

  async openLastTransaction() {
    await tapByElement(this.lastTransactionAmount());
  }

  @Step("Go to asset's accounts from portfolio")
  async goToAccounts(currencyName: string) {
    await scrollToId(this.allocationSectionTitleId, this.accountsListView);
    await tapById(this.assetItemId(currencyName));
  }
}
