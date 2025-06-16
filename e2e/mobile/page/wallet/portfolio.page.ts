import { openDeeplink } from "../../helpers/commonHelpers";

export default class PortfolioPage {
  baseLink = "portfolio";
  baseAssetName = "assetItem-";
  zeroBalance = "$0.00";
  graphCardBalanceId = "graphCard-balance";
  graphCardChart = "graphCard-chart";
  assetBalanceId = "asset-balance";
  readOnlyItemsId = "PortfolioReadOnlyItems";
  accountsListView = "PortfolioAccountsList";
  emptyPortfolioListId = "PortfolioEmptyList";
  portfolioSettingsButtonId = "settings-icon";
  addAccountCta = "add-account-cta";
  allocationSectionTitleId = "portfolio-allocation-section";
  transactionHistorySectionTitleId = "portfolio-transaction-history-section";
  quickActionBuyButton = "portoflio-quick-action-button-buy";
  quickActionSwapButton = "portoflio-quick-action-button-swap";
  quickActionSendButton = "portoflio-quick-action-button-send";
  quickActionReceiveButton = "portoflio-quick-action-button-receive";
  quickActionEarnButton = "portoflio-quick-action-button-earn";
  showAllAssetsButton = "assets-button";
  seeAllTransactionsButton = "portfolio-seeAll-transaction";
  operationRowDate = "operationRowDate";
  assetNameRegExp = new RegExp(`${this.baseAssetName}.*`);

  portfolioSettingsButton = async () => await getElementById(this.portfolioSettingsButtonId);
  assetItemId = (currencyName: string) => `${this.baseAssetName}${currencyName}`;

  @Step("Navigate to Settings")
  async navigateToSettings() {
    await tapByElement(await this.portfolioSettingsButton());
  }

  @Step("Wait for portfolio page to load")
  async waitForPortfolioPageToLoad() {
    await waitForElementById(this.portfolioSettingsButtonId, 120000);
  }

  @Step("Expect Portfolio read only")
  async expectPortfolioReadOnly() {
    await detoxExpect(await this.portfolioSettingsButton()).toBeVisible();
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

  @Step("Click on Add account button in portfolio")
  async addAccount() {
    await scrollToId(this.addAccountCta, this.emptyPortfolioListId);
    await tapById(this.addAccountCta);
  }

  @Step("Expect Portfolio with accounts")
  async expectPortfolioWithAccounts() {
    await detoxExpect(getElementById(this.accountsListView)).toBeVisible();
  }

  @Step("Go to asset's accounts from portfolio")
  async goToAccounts(currencyName: string) {
    await scrollToId(this.allocationSectionTitleId, this.accountsListView);
    await tapById(this.assetItemId(currencyName));
  }

  @Step("Check quick action buttons visibility")
  async checkQuickActionButtonsVisibility() {
    await detoxExpect(getElementById(this.quickActionBuyButton)).toBeVisible();
    await detoxExpect(getElementById(this.quickActionSwapButton)).toBeVisible();
    await detoxExpect(getElementById(this.quickActionSendButton)).toBeVisible();
    await detoxExpect(getElementById(this.quickActionReceiveButton)).toBeVisible();
    await detoxExpect(getElementById(this.quickActionEarnButton)).toBeVisible();
  }

  @Step("Check chart visibility")
  async checkChartVisibility() {
    await detoxExpect(getElementById(this.graphCardChart)).toBeVisible();
  }

  @Step("Check asset allocation section")
  async checkAssetAllocationSection() {
    await scrollToId(this.allocationSectionTitleId);
    await detoxExpect(getElementById(this.allocationSectionTitleId)).toBeVisible();
    jestExpect(await countElementsById(this.assetNameRegExp)).toBeLessThanOrEqual(5);
    await detoxExpect(getElementById(this.showAllAssetsButton)).toBeVisible();
    await tapById(this.showAllAssetsButton);
    jestExpect(await countElementsById(this.assetNameRegExp)).toBeGreaterThan(5);
  }

  @Step("Check asset transaction history")
  async checkTransactionAllocationSection() {
    await scrollToId(this.transactionHistorySectionTitleId);
    await detoxExpect(getElementById(this.transactionHistorySectionTitleId)).toBeVisible();
    jestExpect(await countElementsById(this.operationRowDate)).toBeLessThanOrEqual(3);
    await scrollToId(this.seeAllTransactionsButton, undefined, 300, "bottom");
    await detoxExpect(getElementById(this.seeAllTransactionsButton)).toBeVisible();
    await tapById(this.seeAllTransactionsButton);
    jestExpect(await countElementsById(this.operationRowDate)).toBeGreaterThan(3);
  }

  @Step("Click on selected last operation")
  async selectAndClickOnLastOperation() {
    await tapById(this.operationRowDate);
  }
}
