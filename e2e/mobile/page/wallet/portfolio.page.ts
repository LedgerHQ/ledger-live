import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "../../helpers/commonHelpers";

export default class PortfolioPage {
  addNewOrExistingAccount = "add-new-account-button";
  baseLink = "portfolio";
  baseAssetItem = "assetItem-";
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
  quickActionBuyButton = "portfolio-quick-action-button-buy";
  quickActionSwapButton = "portfolio-quick-action-button-swap";
  quickActionSendButton = "portfolio-quick-action-button-send";
  quickActionReceiveButton = "portfolio-quick-action-button-receive";
  quickActionEarnButton = "portfolio-quick-action-button-earn";
  showAllAssetsButton = "assets-button";
  showAllAccountsButton = "show-all-accounts-button";
  seeAllTransactionsButton = "portfolio-seeAll-transaction";
  operationRowDate = "operationRowDate";
  operationRowCounterValue = "operationRow-counterValue-label";
  assetItemRegExp = new RegExp(`${this.baseAssetItem}[^-]+$`);
  tabSelectorBase = "tab-selector-";
  walletTabSelectorBase = "wallet-tab-";
  selectAssetsPageTitle = "select-crypto-header-step1-title";
  baseBigCurrency = "big-currency";
  bigCurrencyRowRegex = new RegExp(`^${this.baseBigCurrency}-row-.*$`);
  graphCardBalanceDiffId = "graphCard-balance-delta";
  tabBarEarnButton = "tab-bar-earn";
  marketBannerList = "market-banner-list";
  marketBannerTileBase = "market-banner-tile-";
  marketBannerViewAll = "market-banner-view-all";
  fearAndGreedCard = "fear-and-greed-card";
  fearAndGreedTitle = "fear-and-greed-title";
  bottomSheetCloseButton = "drawer-close-button";
  accountsList = "portfolio-assets-layout";
  marketBannerTitle = "market-banner-title";

  portfolioSettingsButton = async () => getElementById(this.portfolioSettingsButtonId);
  assetItemId = (currencyName: string) => `${this.baseAssetItem}${currencyName}`;
  assetItemBalanceId = (currencyName: string) => `${this.baseAssetItem}${currencyName}-balance`;
  tabSelector = (id: "Accounts" | "Assets") => getElementById(`${this.tabSelectorBase}${id}`);
  walletTabSelector = (id: "Wallet" | "Market") =>
    getElementById(`${this.walletTabSelectorBase}${id}`);
  operationByType = (operationType?: string) =>
    getElementByIdAndText(this.operationRowDate, new RegExp(`.*${operationType ?? ""}.*`, "i"));

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

  @Step("Expect asset row to be visible")
  async expectAssetRowToBeVisible(asset: string) {
    await detoxExpect(getElementById(this.assetItemBalanceId(asset))).toBeVisible();
  }

  @Step("Expect asset row to have the correct counter value")
  async expectAssetRowCounterValue(asset: string, counterValue: string) {
    await this.expectAssetRowToBeVisible(asset);
    const text = await getTextOfElement(this.assetItemBalanceId(asset));
    jestExpect(text).toContain(counterValue);
  }

  @Step("Expect total balance value")
  async expectTotalBalanceCounterValue(counterValue: string) {
    const text = await getTextOfElement(this.graphCardBalanceId);
    jestExpect(text).toContain(counterValue);
  }

  @Step("Expect balance diff to be visible")
  async expectBalanceDiffToBeVisible() {
    await detoxExpect(getElementById(this.graphCardBalanceDiffId)).toBeVisible();
  }

  @Step("Expect balance diff to have the correct counter value")
  async expectBalanceDiffCounterValue(counterValue: string) {
    await this.expectBalanceDiffToBeVisible();
    const text = await getTextOfElement(this.graphCardBalanceDiffId);
    jestExpect(text).toContain(counterValue);
  }

  @Step("Expect operation row to be visible")
  async expectOperationRowToBeVisible() {
    await scrollToId(this.operationRowCounterValue, this.accountsListView);
    await detoxExpect(getElementById(this.operationRowCounterValue)).toBeVisible();
  }

  @Step("Expect operation to contain counter value")
  async expectOperationCounterValue(counterValue: string) {
    await this.expectOperationRowToBeVisible();
    const text = await getTextOfElement(this.operationRowCounterValue);
    jestExpect(text).toContain(counterValue);
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
    await waitForElementById(this.accountsListView, 10000);
    await scrollToId(this.allocationSectionTitleId, this.accountsListView, 400);

    if (await IsIdVisible(this.assetItemId(currencyName))) {
      await tapById(this.assetItemId(currencyName));
    } else {
      await tapById(this.showAllAssetsButton);
      await scrollToId(this.assetItemId(currencyName), this.accountsListView);
      await tapById(this.assetItemId(currencyName));
    }
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
    await scrollToId(this.showAllAssetsButton);
    const assetsCount = await countElementsById(this.assetItemRegExp);
    jestExpect(assetsCount).toBeLessThanOrEqual(5);
    await detoxExpect(getElementById(this.showAllAssetsButton)).toBeVisible();
    await tapById(this.showAllAssetsButton);
    jestExpect(await countElementsById(this.assetItemRegExp)).toBeGreaterThan(5);
  }

  @Step("Check accounts section")
  async checkAccountsSection() {
    await this.tapTabSelector("Accounts");
    await scrollToId(this.showAllAccountsButton, this.accountsListView, 400);
    jestExpect(await countElementsById(app.common.accountItemNameRegExp)).toBeLessThanOrEqual(5);
    await this.tapShowAllAccountsButton();
    jestExpect(await countElementsById(app.common.accountItemNameRegExp)).toBeGreaterThan(5);
    await this.tapAddNewOrExistingAccountButton();
    await app.addAccount.importWithYourLedger();
  }

  @Step("Count Accounts")
  async countAccounts() {
    return await countElementsById(app.common.accountItemNameRegExp);
  }

  @Step("Compare Accounts Count")
  async compareAccountsCount(count1: number, count2: number) {
    jestExpect(count1).toBe(count2);
  }

  @Step("Navigate asset Page")
  async goToSpecificAsset(currencyName: string) {
    await scrollToId(this.allocationSectionTitleId, this.accountsListView);
    if (await IsIdVisible(this.showAllAssetsButton)) {
      await tapById(this.showAllAssetsButton);
      await scrollToId(this.assetItemId(currencyName), this.accountsListView);
    }
    await tapById(this.assetItemId(currencyName));
  }

  @Step("Check asset transaction history")
  async checkTransactionHistorySection() {
    await scrollToId(this.transactionHistorySectionTitleId, this.accountsListView);
    await detoxExpect(getElementById(this.transactionHistorySectionTitleId)).toBeVisible();
    jestExpect(await countElementsById(this.operationRowDate)).toBeLessThanOrEqual(3);
    await scrollToId(this.seeAllTransactionsButton, this.accountsListView, 2000, "down");
    await detoxExpect(getElementById(this.seeAllTransactionsButton)).toBeVisible();
    await tapById(this.seeAllTransactionsButton);
    jestExpect(await countElementsById(this.operationRowDate)).toBeGreaterThan(3);
  }

  @Step("Click on selected last operation")
  async selectAndClickOnLastOperation(operationType?: string) {
    await tapByElement(this.operationByType(operationType));
  }

  @Step("Tap on tab selector")
  async tapTabSelector(id: "Accounts" | "Assets") {
    await tapByElement(this.tabSelector(id));
  }

  @Step("Tap on $0 tab selector")
  async tapWalletTabSelector(id: "Wallet" | "Market") {
    await tapByElement(this.walletTabSelector(id));
  }

  @Step("Tap on (Show All Accounts) button")
  async tapShowAllAccountsButton() {
    await scrollToId(this.showAllAccountsButton, this.accountsListView);
    await tapById(this.showAllAccountsButton);
  }

  @Step("Expect (Select Asset) page")
  async checkSelectAssetPage() {
    await waitForElementById(this.selectAssetsPageTitle);
    await detoxExpect(getElementById(this.selectAssetsPageTitle)).toBeVisible();
    await app.common.expectSearchBarVisible();
    jestExpect(await countElementsById(this.bigCurrencyRowRegex)).toBeGreaterThan(6);
  }

  @Step("Open Earn tab from navigation bar")
  async openEarnTab() {
    await tapById(this.tabBarEarnButton);
  }

  @Step("Tap quick action receive button")
  async tapQuickActionReceiveButton() {
    await tapById(this.quickActionReceiveButton);
  }

  @Step("Tap on (Add new or existing account) button")
  async tapAddNewOrExistingAccountButton() {
    if (!(await IsIdVisible(this.addNewOrExistingAccount))) {
      await scrollToId(this.addNewOrExistingAccount, app.portfolio.accountsListView, 400);
    }
    await tapById(this.addNewOrExistingAccount);
  }

  @Step("Expect market banner to be visible")
  async expectMarketBannerVisible() {
    await scrollToId(this.marketBannerTitle, this.accountsListView, undefined, "down");
    await detoxExpect(getElementById(this.marketBannerList)).toBeVisible();
  }

  @Step("Expect fear and greed card to be visible")
  async expectFearAndGreedCardVisible() {
    await detoxExpect(getElementById(this.fearAndGreedCard)).toBeVisible();
  }

  @Step("Tap on fear and greed card")
  async tapFearAndGreedCard() {
    await tapById(this.fearAndGreedCard);
  }

  @Step("Expect fear and greed title in drawer")
  async expectFearAndGreedTitleInDrawer() {
    await waitForElementById(this.fearAndGreedTitle);
    await detoxExpect(getElementById(this.fearAndGreedTitle)).toBeVisible();
  }

  @Step("Close bottom sheet")
  async closeBottomSheet() {
    await getElementById(this.bottomSheetCloseButton).swipe("down");
  }

  @Step("Tap on market banner tile")
  async tapMarketBannerTile(index: number) {
    await detoxExpect(getElementById(`${this.marketBannerTileBase}${index}`)).toBeVisible();
    await tapById(`${this.marketBannerTileBase}${index}`);
  }

  @Step("Tap on market banner view all")
  async tapMarketBannerViewAll() {
    await scrollToId(this.marketBannerViewAll, this.marketBannerList);
    await tapById(this.marketBannerViewAll);
  }

  @Step("Tap on market banner title")
  async tapMarketBannerTitle() {
    await tapById(this.marketBannerTitle);
  }

  @Step("Swipe market banner to view all")
  async swipeMarketBannerToViewAll() {
    await scrollToId(this.marketBannerViewAll, this.marketBannerList, 1000, "right");
  }
}
