import { openDeeplink } from "../../helpers/commonHelpers";
import { Currency, CurrencyType } from "@ledgerhq/live-common/lib/e2e/enum/Currency";

export default class PortfolioPage {
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
  assetItemRegExp = new RegExp(`${this.baseAssetItem}[^-]+$`);
  tabSelectorBase = "tab-selector-";
  selectAssetsPageTitle = "select-crypto-header-step1-title";
  baseBigCurrency = "big-currency";
  bigCurrencyRowRegex = new RegExp(`^${this.baseBigCurrency}-row-.*$`);

  portfolioSettingsButton = async () => getElementById(this.portfolioSettingsButtonId);
  assetItemId = (currencyName: string) => `${this.baseAssetItem}${currencyName}`;
  assetItemNameId = (currencyName: string) => `${this.assetItemId(currencyName)}-name`;
  assetItemCurrencyTickerId = (currencyName: string) => `${this.assetItemId(currencyName)}-ticker`;
  assetItemBalance = (currencyName: string) => `${this.assetItemId(currencyName)}-balance`;
  assetItemDelta = (currencyName: string) => `${this.assetItemId(currencyName)}-delta`;
  bigCurrencyIcon = (currencyId: string) =>
    getElementById(`${this.baseBigCurrency}-icon-${currencyId}`);
  bigCurrencyName = (currencyId: string) =>
    getElementById(`${this.baseBigCurrency}-name-${currencyId}`);
  bigCurrencySubTitle = (currencyId: string) =>
    getElementById(`${this.baseBigCurrency}-subtitle-${currencyId}`);
  tabSelector = (id: "Accounts" | "Assets") => getElementById(`${this.tabSelectorBase}${id}`);

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
    await scrollToId(this.showAllAssetsButton);
    const assetsCount = await countElementsById(this.assetItemRegExp);
    jestExpect(assetsCount).toBeLessThanOrEqual(5);

    for (let i = 0; i < assetsCount; i++) {
      const id = await getIdOfElement(getElementById(this.assetItemRegExp), i);
      const currencyName = id.split("-")[1];
      await detoxExpect(getElementById(this.assetItemNameId(currencyName))).toBeVisible();
      await detoxExpect(getElementById(this.assetItemCurrencyTickerId(currencyName))).toBeVisible();
      await detoxExpect(getElementById(this.assetItemBalance(currencyName))).toBeVisible();
      await detoxExpect(getElementById(this.assetItemDelta(currencyName))).toBeVisible();
      await detoxExpect(getElementById(app.common.parentCurrencyIcon, i)).toBeVisible();
    }

    await detoxExpect(getElementById(this.showAllAssetsButton)).toBeVisible();
    await tapById(this.showAllAssetsButton);
    jestExpect(await countElementsById(this.assetItemRegExp)).toBeGreaterThan(5);
  }

  @Step("Check accounts section")
  async checkAccountsSection() {
    await this.tapTabSelector("Accounts");
    await scrollToId(this.showAllAccountsButton, undefined, 400);
    jestExpect(await countElementsById(app.common.accountItemNameRegExp)).toBeLessThanOrEqual(5);
    await this.tapShowAllAccountsButton();
    jestExpect(await countElementsById(app.common.accountItemNameRegExp)).toBeGreaterThan(5);
    await app.addAccount.tapAddNewOrExistingAccountButton();
    await app.addAccount.importWithYourLedger();
    await this.checkSelectAssetPage();
  }

  @Step("Navigate $0 asset Page")
  async goToSpecificAsset(currencyName: string) {
    await scrollToId(this.showAllAssetsButton);
    await tapById(this.showAllAssetsButton);
    await scrollToId(this.assetItemId(currencyName));
    await tapById(this.assetItemId(currencyName));
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

  @Step("Tap on $0 tab selector")
  async tapTabSelector(id: "Accounts" | "Assets") {
    await tapByElement(await this.tabSelector(id));
  }

  @Step("Tap on (Show All Accounts) button")
  async tapShowAllAccountsButton() {
    await scrollToId(this.showAllAccountsButton);
    await tapById(this.showAllAccountsButton);
  }

  @Step("Expect (Select Asset) page")
  async checkSelectAssetPage() {
    await waitForElementById(this.selectAssetsPageTitle);
    await detoxExpect(getElementById(this.selectAssetsPageTitle)).toBeVisible();
    await app.common.expectSearchBarVisible();
    const assetsCount = await countElementsById(this.bigCurrencyRowRegex);
    for (let i = 0; i < assetsCount; i++) {
      const id = await getIdOfElement(getElementById(this.bigCurrencyRowRegex), i);
      const currencyId = id.split("-")[3];
      const currencyObj = Object.values(Currency).find((c: CurrencyType) => c.id === currencyId);
      await detoxExpect(this.bigCurrencyIcon(currencyId)).toBeVisible();
      await detoxExpect(this.bigCurrencyName(currencyId)).toBeVisible();
      await detoxExpect(this.bigCurrencySubTitle(currencyObj.ticker)).toBeVisible();
    }
  }
}
