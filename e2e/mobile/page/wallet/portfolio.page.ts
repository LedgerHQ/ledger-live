import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "@e2e/helpers/commonHelpers";
import { DEFAULT_TIMEOUT, VISIBILITY_PROBE_TIMEOUT } from "@e2e/helpers/elementHelpers";
import { getFlags } from "@e2e/bridge/server";
import { isAggregatedAssetsEnabled, isAssetSectionEnabled } from "@e2e/utils/featureFlagUtils";
import type { Features } from "@shared/feature-flags";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
export default class PortfolioPage {
  addNewOrExistingAccount = "add-new-account-button";
  assetsListId = "AssetsList";
  baseLink = "portfolio";
  baseAssetItem = "assetItem-";
  analyticsBalanceAmountId = "analytics-balance-amount";
  connectButtonId = "quick-action-connect";
  readOnlyItemsId = "PortfolioReadOnlyItems";
  accountsListView = "PortfolioAccountsList";
  emptyPortfolioListId = "PortfolioEmptyList";
  portfolioSettingsId = "topbar-settings";
  myWalletHeaderSettingsButtonId = "my-wallet-header-settings-button";
  portfolioListIdRegex = new RegExp(`portfolio-screen|${this.readOnlyItemsId}`);
  addAccountCta = "add-account-cta";
  transactionHistorySectionTitleId = "portfolio-transaction-history-section";
  showAllAssetsButton = "assets-button";
  showAllAccountsButton = "show-all-accounts-button";
  seeAllTransactionsButton = "portfolio-seeAll-transaction";
  operationRowBody = "operationRowBody";
  operationRowDate = "operationRowDate";
  operationRowCounterValue = "operationRow-counterValue-label";
  assetItemRegExp = new RegExp(`${this.baseAssetItem}[^-]+$`);
  tabSelectorBase = "tab-selector-";
  marketBannerList = "market-banner-list";
  marketBannerTileBase = "market-banner-tile-";
  marketBannerViewAll = "market-banner-view-all";
  fearAndGreedCard = "fear-and-greed-card";
  fearAndGreedTitle = "fear-and-greed-title";
  bottomSheetCloseButton = "bottom-sheet-header-close-button";
  marketBannerTitle = "market-banner-title";
  quickActionTransferButtonV4 = "quick-action-transfer";
  quickActionSwapButtonV4 = "quick-action-swap";
  quickActionBuyButtonV4 = "quick-action-buy";
  portfolioBalanceNoAccount = "portfolio-balance-noAccounts";
  portfolioBalanceNormal = "portfolio-balance-normal";
  portfolioBalanceAmount = "portfolio-balance-amount";
  portfolioBalanceAnalyticsPill = "portfolio-balance-analytics-pill";
  portfolioBalanceDelta = "portfolio-balance-delta";
  borrowEntryPointId = "portfolio-borrow-entry-point";
  transferBottomSheetReceiveButton = "transfer-action-receive";
  transferBottomSheetSendButton = "transfer-action-send";
  transferBottomSheetBankTransferButton = "transfer-action-bank-transfer";
  portfolioCryptosListId = "PortfolioCryptosList";
  portfolioStablecoinsListId = "PortfolioStablecoinsList";
  cryptoListId = "CryptoList";
  stablecoinListId = "StablecoinList";
  cryptosSectionHeaderId = "portfolio-cryptos-section-header";
  cryptoAddressesListId = "CryptoAddressesList";
  cryptoAddressItemId = (currencyId: string) => `crypto-address-item-${currencyId}`;
  stablecoinsSectionHeaderId = "portfolio-stablecoins-section-header";
  portfolioStocksListId = "PortfolioStocksList";
  stocksListId = "StocksList";
  stocksSectionHeaderId = "portfolio-stocks-section-header";
  stocksDiscoveryId = "portfolio-stocks-discovery";
  stocksDiscoveryHeaderId = "portfolio-stocks-discovery-header";
  sectionAssetItemRegExp = (sectionId: string) => new RegExp(String.raw`^${sectionId}-item-\d+$`);
  sectionAssetItemId = (sectionId: string, index: number) => `${sectionId}-item-${index}`;

  portfolioSettingsButton = async () => getElementById(this.portfolioSettingsId);
  assetItemId = (currencyName: string) => `${this.baseAssetItem}${currencyName}`;
  assetItemBalanceId = (currencyName: string) => `${this.baseAssetItem}${currencyName}-balance`;
  assetItemCountervalueId = (currencyName: string) =>
    `${this.baseAssetItem}${currencyName}-countervalue`;
  assetItemExactRegExp = (currencyName: string) =>
    new RegExp(`^${this.baseAssetItem}${escapeRegExp(currencyName)}$`);
  tabSelector = (id: "Accounts" | "Assets") => getElementById(`${this.tabSelectorBase}${id}`);
  operationByType = (operationType: string | RegExp, accountName?: string) =>
    accountName
      ? getElementByIdWithDescendantTexts(this.operationRowBody, accountName, operationType)
      : getElementByIdWithDescendantTexts(this.operationRowBody, operationType);

  private flags: Features["noah"] | null = null;

  private async loadFlags(): Promise<void> {
    this.flags ??= JSON.parse(await getFlags()).noah;
  }

  async isNoahEnabled(): Promise<boolean> {
    await this.loadFlags();
    return this.flags!.enabled;
  }

  @Step("Wait for portfolio page to load")
  async waitForPortfolioPageToLoad(timeout = 120000) {
    await waitForElementById(this.portfolioListIdRegex, timeout); // TODO: Remove Regex when legacyWallet is removed from source code
  }

  @Step("Expect asset row {{{0}}} to have the correct counter value {{{1}}}")
  async expectAssetRowCounterValue(asset: string, counterValue: string) {
    if (await isAggregatedAssetsEnabled()) {
      await scrollToId(this.assetItemCountervalueId(asset), this.accountsListView);
      const text = await getTextOfElement(this.assetItemCountervalueId(asset));
      jestExpect(text).toContain(counterValue);
    } else {
      await scrollToId(this.assetItemBalanceId(asset), this.accountsListView);
      const text = await getTextOfElement(this.assetItemBalanceId(asset));
      jestExpect(text).toContain(counterValue);
    }
  }

  @Step("Expect balance to be visible")
  async expectBalanceToBeVisible() {
    await detoxExpect(getElementById(this.analyticsBalanceAmountId)).toBeVisible();
  }

  @Step("Expect total balance value {{{0}}}")
  async expectTotalBalanceCounterValue(counterValue: string) {
    const label = await getLabelOfElement(this.portfolioBalanceAmount);
    jestExpect(label).toContain(counterValue);
  }

  @Step("Expect balance diff to be visible")
  async expectBalanceDiffToBeVisible() {
    if (await isAggregatedAssetsEnabled()) {
      return;
    } else {
      await waitForElementById(this.portfolioBalanceAnalyticsPill);
    }
  }

  @Step("Expect operation row to be visible")
  private async expectOperationRowToBeVisible() {
    await scrollToId(this.operationRowCounterValue, this.accountsListView);
    await detoxExpect(getElementById(this.operationRowCounterValue)).toBeVisible();
  }

  @Step("Expect operation to contain counter value {{{0}}}")
  async expectOperationCounterValue(counterValue: string) {
    if (await isAggregatedAssetsEnabled()) {
      await app.mainNavigation.tapTopBarTransactionHistory();
      const text = await app.operation.getOperationCounterValue();
      jestExpect(text).toContain(counterValue);
    } else {
      await this.expectOperationRowToBeVisible();
      const text = await getTextOfElement(this.operationRowCounterValue);
      jestExpect(text).toContain(counterValue);
    }
  }

  @Step("Open Portfolio via deeplink")
  async openViaDeeplink(timeout = 120000) {
    await openDeeplink(this.baseLink);
    await this.waitForPortfolioPageToLoad(timeout); // Issue with RN75 : QAA-370
  }

  @Step("Click on Add account button in portfolio")
  async addAccount() {
    if (await isAggregatedAssetsEnabled()) {
      const ctaId = "crypto-addresses-add-account-cta";
      await scrollToId(ctaId, this.emptyPortfolioListId, 500);
      await tapById(ctaId);
    } else {
      await scrollToId(this.addAccountCta, this.emptyPortfolioListId, 500);
      await tapById(this.addAccountCta);
    }
  }

  @Step("Expect Portfolio with accounts")
  async expectPortfolioWithAccounts() {
    await detoxExpect(getElementById(this.accountsListView)).toBeVisible();
  }

  @Step("Wait for Portfolio with accounts")
  async waitForPortfolioWithAccounts() {
    await waitForElementById(this.accountsListView, 10000);
  }

  @Step("Go to {{{0}}} accounts from portfolio")
  async goToAccounts(currencyName: string, currencyId?: string) {
    await waitForElementById(this.accountsListView, 10000);
    if (await isAggregatedAssetsEnabled()) {
      await scrollToId("crypto-addresses-button", this.accountsListView);
      await tapById("crypto-addresses-button");
      await waitForElementById(this.cryptoAddressesListId);
      if (currencyId) {
        await scrollToId(this.cryptoAddressItemId(currencyId), this.cryptoAddressesListId);
        await tapById(this.cryptoAddressItemId(currencyId));
      }
    } else {
      await revealForTap(this.assetItemId(currencyName), { container: this.accountsListView });
      await tapById(this.assetItemId(currencyName));
    }
  }

  @Step("Check quick action buttons visibility")
  async checkQuickActionButtonsVisibility() {
    await waitForElementById(this.quickActionTransferButtonV4);
    await waitForElementById(this.quickActionSwapButtonV4);
    await waitForElementById(this.quickActionBuyButtonV4);
  }

  @Step("Check asset allocation section")
  async checkAssetAllocationSection() {
    if (await isAssetSectionEnabled()) {
      await scrollToId(this.cryptosSectionHeaderId, this.accountsListView);
      await detoxExpect(getElementById(this.cryptosSectionHeaderId)).toBeVisible();
    } else {
      await scrollToId(this.showAllAssetsButton, this.accountsListView);
      const assetsCount = await countElementsById(this.assetItemRegExp);
      jestExpect(assetsCount).toBeLessThanOrEqual(5);
      await detoxExpect(getElementById(this.showAllAssetsButton)).toBeVisible();
      await tapById(this.showAllAssetsButton);
      jestExpect(await countElements(getElementsById(this.assetItemRegExp))).toBeGreaterThan(5);
    }
  }

  @Step("Check accounts section")
  async checkAccountsSection() {
    if (await isAssetSectionEnabled()) {
      await this.tapAddNewOrExistingAccountButton();
      await app.addAccount.importWithYourLedger();
    } else {
      await this.tapTabSelector("Accounts");
      await scrollToId(this.showAllAccountsButton, this.accountsListView, 400);
      jestExpect(await countElementsById(app.common.accountItemNameRegExp)).toBeLessThanOrEqual(5);
      await this.tapShowAllAccountsButton();
      jestExpect(
        await countElements(getElementsById(app.common.accountItemNameRegExp)),
      ).toBeGreaterThan(5);
      await this.tapAddNewOrExistingAccountButton();
      await app.addAccount.importWithYourLedger();
    }
  }

  @Step("Count Accounts")
  async countAccounts() {
    return await countElementsById(app.common.accountItemNameRegExp);
  }

  @Step("Compare Accounts Count {{{0}}} and {{{1}}}")
  async compareAccountsCount(count1: number, count2: number) {
    jestExpect(count1).toBe(count2);
  }

  @Step("Navigate asset Page {{{0}}}")
  async goToSpecificAsset(currencyName: string) {
    if (!(await isAssetSectionEnabled())) {
      await scrollToId(this.assetsListId, this.accountsListView);
      if (await IsIdVisible(this.showAllAssetsButton)) {
        await tapById(this.showAllAssetsButton);
      }
    }
    await scrollToId(this.assetItemId(currencyName), this.accountsListView);
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
    jestExpect(await countElements(getElementsById(this.operationRowDate))).toBeGreaterThan(3);
  }

  @Step("Click on selected last operation {{{0}}} for {{{1}}}")
  async selectAndClickOnLastOperation(operationType: string | RegExp, accountName?: string) {
    await tapByElement(this.operationByType(operationType, accountName).atIndex(0));
  }

  @Step("Tap on tab selector {{{0}}}")
  async tapTabSelector(id: "Accounts" | "Assets") {
    if (await isAssetSectionEnabled()) {
      return;
    }
    await tapByElement(this.tabSelector(id));
  }

  @Step("Tap on (Show All Accounts) button")
  private async tapShowAllAccountsButton() {
    await scrollToId(this.showAllAccountsButton, this.accountsListView);
    await tapById(this.showAllAccountsButton);
  }

  @Step("Tap on (Add new or existing account) button")
  async tapAddNewOrExistingAccountButton() {
    if (!(await IsIdVisible(this.addNewOrExistingAccount))) {
      await scrollToId(this.addNewOrExistingAccount, app.portfolio.accountsListView, 400);
    }
    await tapById(this.addNewOrExistingAccount);
  }

  @Step("Expect market banner to be visible")
  async expectMarketBannerVisible(direction: "up" | "down" = "down") {
    await scrollToId(this.marketBannerTitle, this.accountsListView, undefined, direction);
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

  @Step("Tap on market banner tile {{{0}}}")
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
    await scrollToId(this.marketBannerViewAll, this.marketBannerList, undefined, "right");
  }

  @Step("Check quick action transfer button visibility")
  async checkQuickActionTransferButtonVisibility() {
    await waitForElementById(this.quickActionTransferButtonV4);
  }

  @Step("Check quick action swap button visibility")
  async checkQuickActionSwapButtonVisibility() {
    await waitForElementById(this.quickActionSwapButtonV4);
  }

  @Step("Check quick action buy button visibility")
  async checkQuickActionBuyButtonVisibility() {
    await waitForElementById(this.quickActionBuyButtonV4);
  }

  @Step("Press quick action buy button")
  async pressQuickActionBuyButton() {
    await tapById(this.quickActionBuyButtonV4);
  }

  @Step("Press quick action swap button")
  async pressQuickActionSwapButton() {
    await tapById(this.quickActionSwapButtonV4);
  }

  @Step("Press quick action transfer button")
  async pressQuickActionTransferButton() {
    await tapById(this.quickActionTransferButtonV4);
  }
  @Step("Check no balance title visibility")
  async checkNoBalanceTitleVisibility() {
    await waitForElementById(this.portfolioBalanceNoAccount);
  }

  @Step("Check normal balance title visibility")
  async checkNormalBalanceTitleVisibility() {
    await waitForElementById(this.portfolioBalanceNormal);
  }

  @Step("Check portfolio balance analytics pill visibility")
  async checkPortfolioBalanceAnalyticsPillVisibility() {
    await waitForElementById(this.portfolioBalanceAnalyticsPill);
  }

  @Step("Tap on portfolio balance analytics pill")
  async tapPortfolioBalanceAnalyticsPill() {
    await tapById(this.portfolioBalanceAnalyticsPill);
  }

  @Step("Check transfer bottom sheet receive button visibility")
  async checkTransferBottomSheetReceiveButtonVisibility() {
    await detoxExpect(getElementById(this.transferBottomSheetReceiveButton)).toBeVisible();
  }

  @Step("Check transfer bottom sheet send button visibility")
  async checkTransferBottomSheetSendButtonVisibility() {
    await detoxExpect(getElementById(this.transferBottomSheetSendButton)).toBeVisible();
  }

  @Step("Check transfer bottom sheet bank transfer button visibility")
  async checkTransferBottomSheetBankTransferButtonVisibility() {
    await detoxExpect(getElementById(this.transferBottomSheetBankTransferButton)).toBeVisible();
  }

  @Step("Press transfer bottom sheet receive button")
  async pressTransferBottomSheetReceiveButton() {
    await tapById(this.transferBottomSheetReceiveButton);
  }

  @Step("Open the receive drawer")
  async openReceiveDrawer() {
    await this.pressQuickActionTransferButton();
    await this.pressTransferBottomSheetReceiveButton();
  }

  @Step("Press transfer bottom sheet send button")
  async pressTransferBottomSheetSendButton() {
    await tapById(this.transferBottomSheetSendButton);
  }

  @Step("Press transfer bottom sheet bank transfer button")
  async pressTransferBottomSheetBankTransferButton() {
    await tapById(this.transferBottomSheetBankTransferButton);
  }

  private async checkSectionVisible(
    sectionId: string,
    itemCount: number,
    isEmptyPortfolio: boolean,
  ) {
    const scrollViewId = isEmptyPortfolio ? this.emptyPortfolioListId : this.accountsListView;
    const lastItemId = this.sectionAssetItemId(sectionId, itemCount - 1);
    await scrollToId(lastItemId, scrollViewId);
    await detoxExpect(getElementById(lastItemId)).toBeVisible();
  }

  @Step("Check cryptos list section is visible {{{0}}}")
  async checkCryptosListSectionVisible(itemCount: number, isEmptyPortfolio = false) {
    await this.checkSectionVisible(this.portfolioCryptosListId, itemCount, isEmptyPortfolio);
  }

  @Step("Check stablecoins list section is visible {{{0}}}")
  async checkStablecoinsListSectionVisible(itemCount: number, isEmptyPortfolio = false) {
    await this.checkSectionVisible(this.portfolioStablecoinsListId, itemCount, isEmptyPortfolio);
  }

  @Step("Check add account CTA is visible")
  async checkAddAccountCtaVisible() {
    await scrollToId(this.addAccountCta, this.emptyPortfolioListId, 500);
    await detoxExpect(getElementById(this.addAccountCta)).toBeVisible();
  }

  @Step("Check total asset item count on page {{{0}}}")
  async checkTotalAssetItemCount(expected: number) {
    const count = await countElements(getElementsById(this.assetItemRegExp));
    jestExpect(count).toBe(expected);
  }

  private async checkSectionAssetItemCount(sectionId: string, expected: number) {
    const count = await countElements(getElementsById(this.sectionAssetItemRegExp(sectionId)));
    jestExpect(count).toBe(expected);
  }

  @Step("Check cryptos section asset item count {{{0}}}")
  async checkCryptosSectionAssetItemCount(expected: number) {
    await this.checkSectionAssetItemCount(this.portfolioCryptosListId, expected);
  }

  @Step("Check stablecoins section asset item count {{{0}}}")
  async checkStablecoinsSectionAssetItemCount(expected: number) {
    await this.checkSectionAssetItemCount(this.portfolioStablecoinsListId, expected);
  }

  @Step("Tap first asset item (wallet 4.0) and return its currency name")
  async tapFirstAssetItemW40(): Promise<string> {
    const testId = await getIdByRegexp(this.assetItemRegExp, 0);
    const currencyName = testId.replace("assetItem-", "");
    await revealForTap(testId, { container: this.emptyPortfolioListId, direction: "up" });
    await tapById(testId);
    return currencyName;
  }

  @Step("Check asset is visible on page {{{0}}}")
  async checkAssetVisible(currencyName: string) {
    await detoxExpect(getElementById(`assetItem-${currencyName}`)).toExist();
  }

  @Step("Check aggregated asset row {{{0}}} is visible")
  async checkAggregatedAssetRowVisible(currencyName: string, scrollViewId?: string) {
    if (scrollViewId) {
      await scrollToId(this.assetItemId(currencyName), scrollViewId);
    }

    await detoxExpect(getElementById(this.assetItemId(currencyName))).toBeVisible();
  }

  @Step("Get aggregated asset row count {{{0}}}")
  async getAggregatedAssetRowCount(currencyName: string) {
    return await countElements(getElementsById(this.assetItemExactRegExp(currencyName)));
  }

  @Step("Check asset countervalue {{{0}}} is visible")
  async checkAssetCountervalueVisible(currencyName: string, scrollViewId?: string) {
    if (scrollViewId) {
      await scrollToId(this.assetItemId(currencyName), scrollViewId);
    }

    await detoxExpect(getElementById(this.assetItemCountervalueId(currencyName))).toBeVisible();
  }

  @Step("Open Wallet 4.0 asset detail {{{0}}}")
  async openAssetDetailW40(currencyName: string, scrollViewId?: string) {
    if (scrollViewId) {
      await scrollToId(this.assetItemId(currencyName), scrollViewId);
    }

    await detoxExpect(getElementById(this.assetItemId(currencyName))).toBeVisible();
    await tapById(this.assetItemId(currencyName));
  }

  @Step("Open Wallet 4.0 stablecoins list")
  async openStablecoinsListW40() {
    await this.tapStablecoinsSectionTitle();
    await this.checkStablecoinListPageVisible();
  }

  @Step("Check if full stablecoin list page is visible")
  async isStablecoinListPageVisible(timeout = VISIBILITY_PROBE_TIMEOUT) {
    return await IsIdVisible(this.stablecoinListId, timeout);
  }

  @Step("Tap cryptos section title")
  async tapCryptosSectionTitle() {
    await waitForElementById(this.accountsListView);
    await scrollToId(this.cryptosSectionHeaderId, this.accountsListView);
    await detoxExpect(getElementById(this.cryptosSectionHeaderId)).toBeVisible();
    await tapById(this.cryptosSectionHeaderId);
  }

  @Step("Tap stablecoins section title")
  async tapStablecoinsSectionTitle() {
    await waitForElementById(this.accountsListView);
    await scrollToId(this.stablecoinsSectionHeaderId, this.accountsListView);
    await detoxExpect(getElementById(this.stablecoinsSectionHeaderId)).toBeVisible();
    await tapById(this.stablecoinsSectionHeaderId);
  }

  private async checkListPageVisible(listId: string) {
    await waitForElementById(listId);
    await detoxExpect(getElementById(listId)).toBeVisible();
  }

  @Step("Check full crypto list page is visible")
  async checkCryptoListPageVisible() {
    await this.checkListPageVisible(this.cryptoListId);
  }

  @Step("Check full stablecoin list page is visible")
  async checkStablecoinListPageVisible() {
    await this.checkListPageVisible(this.stablecoinListId);
  }

  private async scrollToStocksHeader(headerId: string) {
    await waitForElementById(headerId, DEFAULT_TIMEOUT, { checkVisibility: false });
    await scrollToId(headerId, this.accountsListView);
  }

  @Step("Check stocks discovery (empty) section is visible")
  async checkStocksDiscoverySectionVisible() {
    await this.scrollToStocksHeader(this.stocksDiscoveryHeaderId);
    await detoxExpect(getElementById(this.stocksDiscoveryId)).toExist();
    await detoxExpect(getElementById(this.stocksDiscoveryHeaderId)).toBeVisible();
  }

  @Step("Tap 'Explore all' in the stocks discovery section")
  async tapStocksExploreAll() {
    await this.scrollToStocksHeader(this.stocksDiscoveryHeaderId);
    await tapById(this.stocksDiscoveryHeaderId);
  }

  @Step("Check stocks holdings section is visible")
  async checkStocksHoldingsSectionVisible() {
    await this.scrollToStocksHeader(this.stocksSectionHeaderId);
    await detoxExpect(getElementById(this.stocksSectionHeaderId)).toBeVisible();
    await detoxExpect(getElementById(this.portfolioStocksListId)).toExist();
  }

  @Step("Tap stocks section title")
  async tapStocksSectionTitle() {
    await this.scrollToStocksHeader(this.stocksSectionHeaderId);
    await tapById(this.stocksSectionHeaderId);
  }

  @Step("Check full stocks list page is visible")
  async checkStocksListPageVisible() {
    await this.checkListPageVisible(this.stocksListId);
  }

  @Step("Expect borrow entry point to be visible")
  async expectBorrowEntryPointVisible() {
    await scrollToId(this.borrowEntryPointId, this.accountsListView);
    await waitForElementById(this.borrowEntryPointId);
  }

  /**
   * The card and its CTA share one onPress, so tap the card rather than the nested button.
   * The card enters from the bottom, so it parks against the tab bar until revealForTap
   * continues past it.
   */
  @Step("Click borrow entry point")
  async clickBorrowEntryPoint() {
    await revealForTap(this.borrowEntryPointId, { container: this.accountsListView });
    await tapById(this.borrowEntryPointId);
  }
}
