import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "@e2e/helpers/commonHelpers";
import { byId, type NativeHandle } from "@e2e/helpers/elements/native";
import { getFlags } from "@e2e/bridge/server";
import { TIMEOUT } from "@e2e/utils/timeouts";
import type { Features } from "@shared/feature-flags";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

const ASSET_ITEM_PREFIX = "assetItem-";
const CRYPTOS_SECTION_ID = "PortfolioCryptosList";
const STABLECOINS_SECTION_ID = "PortfolioStablecoinsList";

type AssetRowOptions = {
  /** Scroll the full stablecoin list to the row first. */
  inStablecoinList?: boolean;
};

export default class PortfolioPage {
  private readonly baseLink = "portfolio";

  // The regex also matches the legacy wallet screen, until legacyWallet leaves the source code.
  private readonly portfolioList = byId(/portfolio-screen|PortfolioReadOnlyItems/);
  private readonly readOnlyItems = byId("PortfolioReadOnlyItems");
  private readonly accountsList = byId("PortfolioAccountsList");
  private readonly emptyPortfolioList = byId("PortfolioEmptyList");
  private readonly heroScrollView = byId(/^(PortfolioAccountsList|PortfolioEmptyList)$/);
  private readonly analyticsBalanceAmount = byId("analytics-balance-amount");
  private readonly balanceNoSignerTitle = byId("portfolio-balance-noSigner-title");
  private readonly balanceNoAccount = byId("portfolio-balance-noAccounts");
  private readonly balanceNormal = byId("portfolio-balance-normal");
  private readonly balanceAmount = byId("portfolio-balance-amount");
  private readonly balanceAnalyticsPill = byId("portfolio-balance-analytics-pill");
  private readonly quickActionsCtas = byId("quick-actions-ctas");
  private readonly quickActionTransferButton = byId("quick-action-transfer");
  private readonly quickActionSwapButton = byId("quick-action-swap");
  private readonly quickActionBuyButton = byId("quick-action-buy");
  private readonly quickActionSendButton = byId("quick-action-send");
  private readonly quickActionBuyLedgerButton = byId("quick-action-buy-ledger");
  private readonly connectButton = byId("quick-action-connect");
  private readonly transferDrawer = byId("transfer-drawer");
  private readonly transferReceiveButton = byId("transfer-action-receive");
  private readonly transferSendButton = byId("transfer-action-send");
  private readonly transferBankTransferButton = byId("transfer-action-bank-transfer");
  private readonly addAccountCta = byId("add-account-cta");
  private readonly cryptoAddressesAddAccountCta = byId("crypto-addresses-add-account-cta");
  private readonly cryptoAddressesButton = byId("crypto-addresses-button");
  private readonly cryptoAddressesList = byId("CryptoAddressesList");
  private readonly accountItemName = byId(/account-item-.*-name/);
  private readonly marketBannerList = byId("market-banner-list");
  private readonly marketBannerViewAll = byId("market-banner-view-all");
  private readonly marketBannerTitle = byId("market-banner-title");
  private readonly fearAndGreedCard = byId("fear-and-greed-card");
  private readonly fearAndGreedTitle = byId("fear-and-greed-title");
  private readonly bottomSheetCloseButton = byId("bottom-sheet-header-close-button");
  private readonly cryptosSectionHeader = byId("portfolio-cryptos-section-header");
  private readonly stablecoinsSectionHeader = byId("portfolio-stablecoins-section-header");
  private readonly cryptoList = byId("CryptoList");
  private readonly stablecoinList = byId("StablecoinList");
  private readonly portfolioStocksList = byId("PortfolioStocksList");
  private readonly stocksList = byId("StocksList");
  private readonly stocksSectionHeader = byId("portfolio-stocks-section-header");
  private readonly stocksDiscovery = byId("portfolio-stocks-discovery");
  private readonly stocksDiscoveryHeader = byId("portfolio-stocks-discovery-header");
  private readonly borrowEntryPoint = byId("portfolio-borrow-entry-point");
  private readonly marketBannerTile = (index: number) => byId(`market-banner-tile-${index}`);
  private readonly cryptoAddressItem = (currencyId: string) =>
    byId(`crypto-address-item-${currencyId}`);
  /** An asset row, not its "-countervalue" child. */
  private readonly anyAssetItem = (index = 0) =>
    byId(new RegExp(`${ASSET_ITEM_PREFIX}[^-]+$`), index);
  private readonly assetItem = (currencyName: string) =>
    byId(`${ASSET_ITEM_PREFIX}${currencyName}`);
  private readonly assetItemExact = (currencyName: string) =>
    byId(new RegExp(`^${ASSET_ITEM_PREFIX}${escapeRegExp(currencyName)}$`));
  private readonly assetItemCountervalue = (currencyName: string) =>
    byId(`${ASSET_ITEM_PREFIX}${currencyName}-countervalue`);
  private readonly sectionAssetItems = (sectionId: string) =>
    byId(new RegExp(String.raw`^${sectionId}-item-\d+$`));
  private readonly sectionAssetItem = (sectionId: string, index: number) =>
    byId(`${sectionId}-item-${index}`);

  private flags: Features["noah"] | null = null;

  private async loadFlags(): Promise<void> {
    this.flags ??= JSON.parse(await getFlags()).noah;
  }

  async isNoahEnabled(): Promise<boolean> {
    await this.loadFlags();
    return this.flags!.enabled;
  }

  @Step("Wait for portfolio page to load")
  async waitForPortfolioPageToLoad(timeout = TIMEOUT.xxxlarge) {
    await this.portfolioList.waitVisible(timeout);
  }

  @Step("Expect asset row {{{0}}} to have the correct counter value {{{1}}}")
  async expectAssetRowCounterValue(asset: string, counterValue: string) {
    await this.assetItemCountervalue(asset).scrollTo(this.accountsList);
    await this.assetItemCountervalue(asset).expectText(counterValue, { containing: true });
  }

  /**
   * The balance and the quick-action row live in the portfolio list's first row, which Android
   * detaches from the view hierarchy once the list is scrolled past it — the target is then absent,
   * not merely under-visible, and no wait recovers it.
   *
   * Detox's `scrollTo("top")` force-breaks on this list: its pull-to-refresh control means the
   * action never reports a top edge.
   */
  private async ensureHeroVisible(target: NativeHandle) {
    await target.scrollTo(this.heroScrollView, { direction: "up" });
  }

  @Step("Expect balance to be visible")
  async expectBalanceToBeVisible() {
    await this.analyticsBalanceAmount.expectVisible();
  }

  @Step("Expect total balance value {{{0}}}")
  async expectTotalBalanceCounterValue(counterValue: string) {
    await this.ensureHeroVisible(this.balanceNormal);
    await this.balanceNormal.waitVisible();
    await this.balanceAmount.expectLabel(counterValue, { containing: true });
  }

  @Step("Expect operation to contain counter value {{{0}}}")
  async expectOperationCounterValue(counterValue: string) {
    await app.mainNavigation.tapTopBarTransactionHistory();
    const text = await app.operation.getOperationCounterValue();
    jestExpect(text).toContain(counterValue);
  }

  @Step("Open Portfolio via deeplink")
  async openViaDeeplink(timeout = TIMEOUT.xxxlarge) {
    await openDeeplink(this.baseLink);
    await this.waitForPortfolioPageToLoad(timeout); // Issue with RN75 : QAA-370
  }

  @Step("Click on Add account button in portfolio")
  async addAccount() {
    await this.cryptoAddressesAddAccountCta.scrollTo(this.emptyPortfolioList, { pixels: 500 });
    await this.cryptoAddressesAddAccountCta.tap();
  }

  @Step("Expect Portfolio with accounts")
  async expectPortfolioWithAccounts() {
    await this.accountsList.expectVisible();
  }

  @Step("Wait for Portfolio with accounts")
  async waitForPortfolioWithAccounts() {
    await this.accountsList.waitVisible(TIMEOUT.medium);
  }

  @Step("Go to {{{0}}} accounts from portfolio")
  async goToAccounts(currencyId: string) {
    await this.openCryptoAddresses();
    await this.cryptoAddressItem(currencyId).scrollTo(this.cryptoAddressesList);
    await this.cryptoAddressItem(currencyId).tap();
  }

  @Step("Check quick action buttons visibility")
  async checkQuickActionButtonsVisibility() {
    await this.ensureHeroVisible(this.quickActionsCtas);
    await this.quickActionTransferButton.waitVisible();
    await this.quickActionSwapButton.waitVisible();
    await this.quickActionBuyButton.waitVisible();
  }

  @Step("Check asset allocation section")
  async checkAssetAllocationSection() {
    await this.cryptosSectionHeader.scrollTo(this.accountsList);
    await this.cryptosSectionHeader.expectVisible();
  }

  @Step("Open Crypto Addresses from portfolio")
  async openCryptoAddresses() {
    await this.accountsList.waitVisible(TIMEOUT.medium);
    await this.cryptoAddressesButton.revealForTap(this.accountsList);
    await this.cryptoAddressesButton.tap();
    await this.cryptoAddressesList.waitVisible();
  }

  @Step("Count Accounts")
  async countAccounts() {
    await this.accountItemName.scrollTo(this.cryptoAddressesList);
    return await this.accountItemName.count({ visibleOnly: true });
  }

  @Step("Expect at least one account")
  expectAtLeastOneAccount(count: number) {
    jestExpect(count).toBeGreaterThan(0);
  }

  @Step("Compare Accounts Count {{{0}}} and {{{1}}}")
  async compareAccountsCount(count1: number, count2: number) {
    jestExpect(count1).toBe(count2);
  }

  @Step("Navigate asset Page {{{0}}}")
  async goToSpecificAsset(currencyName: string) {
    await this.assetItem(currencyName).scrollTo(this.accountsList);
    await this.assetItem(currencyName).tap();
  }

  @Step("Tap on Connect button")
  async tapConnectButton() {
    await this.connectButton.tap();
  }

  @Step("Expect market banner to be visible")
  async expectMarketBannerVisible() {
    await this.marketBannerList.expectVisible();
  }

  @Step("Expect fear and greed card to be visible")
  async expectFearAndGreedCardVisible() {
    await this.fearAndGreedCard.expectVisible();
  }

  @Step("Tap on fear and greed card")
  async tapFearAndGreedCard() {
    await this.fearAndGreedCard.tap();
  }

  @Step("Expect fear and greed title in drawer")
  async expectFearAndGreedTitleInDrawer() {
    await this.fearAndGreedTitle.waitVisible();
    await this.fearAndGreedTitle.expectVisible();
  }

  @Step("Close bottom sheet")
  async closeBottomSheet() {
    await this.bottomSheetCloseButton.swipe("down");
  }

  @Step("Tap on market banner tile {{{0}}}")
  async tapMarketBannerTile(index: number) {
    await this.marketBannerTile(index).expectVisible();
    await this.marketBannerTile(index).tap();
  }

  @Step("Tap on market banner view all")
  async tapMarketBannerViewAll() {
    await this.marketBannerViewAll.scrollTo(this.marketBannerList);
    await this.marketBannerViewAll.tap();
  }

  @Step("Tap on market banner title")
  async tapMarketBannerTitle() {
    await this.marketBannerTitle.tap();
  }

  @Step("Swipe market banner to view all")
  async swipeMarketBannerToViewAll() {
    await this.marketBannerViewAll.scrollTo(this.marketBannerList, { direction: "right" });
  }

  @Step("Check quick action transfer button visibility")
  async checkQuickActionTransferButtonVisibility() {
    await this.ensureHeroVisible(this.quickActionTransferButton);
    await this.quickActionTransferButton.expectVisible();
  }

  @Step("Check quick action swap button visibility")
  async checkQuickActionSwapButtonVisibility() {
    await this.ensureHeroVisible(this.quickActionSwapButton);
    await this.quickActionSwapButton.expectVisible();
  }

  @Step("Check quick action buy button visibility")
  async checkQuickActionBuyButtonVisibility() {
    await this.ensureHeroVisible(this.quickActionBuyButton);
    await this.quickActionBuyButton.expectVisible();
  }

  private async waitForQuickActionsSettled() {
    await this.ensureHeroVisible(this.quickActionsCtas);
    await this.quickActionsCtas.waitFullyVisible();
  }

  @Step("Press quick action buy button")
  async pressQuickActionBuyButton() {
    await this.waitForQuickActionsSettled();
    await this.quickActionBuyButton.tap();
  }

  @Step("Press quick action swap button")
  async pressQuickActionSwapButton() {
    await this.waitForQuickActionsSettled();
    await this.quickActionSwapButton.tap();
  }

  @Step("Press quick action transfer button")
  async pressQuickActionTransferButton() {
    await this.waitForQuickActionsSettled();
    await this.quickActionTransferButton.tap();
  }

  @Step("Expect the read-only Wallet to be visible")
  async expectReadOnlyPortfolioVisible(timeout = TIMEOUT.xxxlarge) {
    await this.readOnlyItems.waitVisible(timeout);
  }

  @Step("Expect the no-signer balance title to be visible")
  async expectNoSignerBalanceTitleVisible() {
    await this.balanceNoSignerTitle.expectVisible();
  }

  @Step("Expect the portfolio balance amount not to be visible")
  async expectBalanceAmountNotVisible() {
    await this.balanceAmount.expectNotVisible();
  }

  @Step("Expect the Connect quick action to be visible")
  async expectConnectQuickActionVisible() {
    await this.connectButton.expectVisible();
  }

  @Step("Expect the Buy a Ledger quick action to be visible")
  async expectBuyLedgerQuickActionVisible() {
    await this.quickActionBuyLedgerButton.expectVisible();
  }

  @Step("Expect the Transfer, Send, Swap and Buy quick actions not to be visible")
  async expectSignerQuickActionsNotVisible() {
    await this.quickActionTransferButton.expectNotVisible();
    await this.quickActionSendButton.expectNotVisible();
    await this.quickActionSwapButton.expectNotVisible();
    await this.quickActionBuyButton.expectNotVisible();
  }

  @Step("Expect the accounts list not to be visible")
  async expectAccountsListNotVisible() {
    await this.accountsList.expectNotVisible();
  }

  @Step("Check no balance title visibility")
  async checkNoBalanceTitleVisibility() {
    await this.ensureHeroVisible(this.balanceNoAccount);
    await this.balanceNoAccount.expectVisible();
  }

  @Step("Check normal balance title visibility")
  async checkNormalBalanceTitleVisibility() {
    await this.ensureHeroVisible(this.balanceNormal);
    await this.balanceNormal.expectVisible();
  }

  @Step("Check portfolio balance analytics pill visibility")
  async checkPortfolioBalanceAnalyticsPillVisibility() {
    await this.ensureHeroVisible(this.balanceAnalyticsPill);
    await this.balanceAnalyticsPill.expectVisible();
  }

  @Step("Tap on portfolio balance analytics pill")
  async tapPortfolioBalanceAnalyticsPill() {
    await this.ensureHeroVisible(this.balanceAnalyticsPill);
    await this.balanceAnalyticsPill.tap();
  }

  @Step("Check transfer bottom sheet receive button visibility")
  async checkTransferBottomSheetReceiveButtonVisibility() {
    await this.transferReceiveButton.expectVisible();
  }

  @Step("Check transfer bottom sheet send button visibility")
  async checkTransferBottomSheetSendButtonVisibility() {
    await this.transferSendButton.expectVisible();
  }

  @Step("Check transfer bottom sheet bank transfer button visibility")
  async checkTransferBottomSheetBankTransferButtonVisibility() {
    await this.transferBankTransferButton.expectVisible();
  }

  // Anchor on the container: the controls are matchable while the sheet still slides (QAA-1522).
  private async waitForTransferDrawerSettled() {
    await this.transferDrawer.waitFullyVisible();
  }

  @Step("Press transfer bottom sheet receive button")
  async pressTransferBottomSheetReceiveButton() {
    await this.waitForTransferDrawerSettled();
    await this.transferReceiveButton.tap();
  }

  @Step("Open the receive drawer")
  async openReceiveDrawer() {
    await this.pressQuickActionTransferButton();
    await this.pressTransferBottomSheetReceiveButton();
  }

  @Step("Press transfer bottom sheet send button")
  async pressTransferBottomSheetSendButton() {
    await this.waitForTransferDrawerSettled();
    await this.transferSendButton.tap();
  }

  @Step("Press transfer bottom sheet bank transfer button")
  async pressTransferBottomSheetBankTransferButton() {
    await this.waitForTransferDrawerSettled();
    await this.transferBankTransferButton.tap();
  }

  private async checkSectionVisible(
    sectionId: string,
    itemCount: number,
    isEmptyPortfolio: boolean,
  ) {
    const scrollView = isEmptyPortfolio ? this.emptyPortfolioList : this.accountsList;
    const lastItem = this.sectionAssetItem(sectionId, itemCount - 1);
    await lastItem.scrollTo(scrollView);
    await lastItem.expectVisible();
  }

  @Step("Check cryptos list section is visible {{{0}}}")
  async checkCryptosListSectionVisible(itemCount: number, isEmptyPortfolio = false) {
    await this.checkSectionVisible(CRYPTOS_SECTION_ID, itemCount, isEmptyPortfolio);
  }

  @Step("Check stablecoins list section is visible {{{0}}}")
  async checkStablecoinsListSectionVisible(itemCount: number, isEmptyPortfolio = false) {
    await this.checkSectionVisible(STABLECOINS_SECTION_ID, itemCount, isEmptyPortfolio);
  }

  @Step("Check add account CTA is visible")
  async checkAddAccountCtaVisible() {
    await this.addAccountCta.scrollTo(this.emptyPortfolioList, { pixels: 500 });
    await this.addAccountCta.expectVisible();
  }

  @Step("Check total asset item count on page {{{0}}}")
  async checkTotalAssetItemCount(expected: number) {
    await this.anyAssetItem().expectCount(expected);
  }

  @Step("Check cryptos section asset item count {{{0}}}")
  async checkCryptosSectionAssetItemCount(expected: number) {
    await this.sectionAssetItems(CRYPTOS_SECTION_ID).expectCount(expected);
  }

  @Step("Check stablecoins section asset item count {{{0}}}")
  async checkStablecoinsSectionAssetItemCount(expected: number) {
    await this.sectionAssetItems(STABLECOINS_SECTION_ID).expectCount(expected);
  }

  @Step("Tap first asset item (wallet 4.0) and return its currency name")
  async tapFirstAssetItemW40(): Promise<string> {
    const firstAssetItem = this.anyAssetItem();
    await firstAssetItem.revealForTap(this.emptyPortfolioList, { direction: "up" });
    const currencyName = (await firstAssetItem.getIdentifier()).replace(ASSET_ITEM_PREFIX, "");
    await firstAssetItem.tap();
    return currencyName;
  }

  @Step("Check asset is visible on page {{{0}}}")
  async checkAssetVisible(currencyName: string) {
    await this.assetItem(currencyName).expectExist();
  }

  @Step("Check aggregated asset row {{{0}}} is visible")
  async checkAggregatedAssetRowVisible(currencyName: string, options: AssetRowOptions = {}) {
    if (options.inStablecoinList) {
      await this.assetItem(currencyName).scrollTo(this.stablecoinList);
    }
    await this.assetItem(currencyName).expectVisible();
  }

  @Step("Get aggregated asset row count {{{0}}}")
  async getAggregatedAssetRowCount(currencyName: string) {
    return await this.assetItemExact(currencyName).count();
  }

  @Step("Check asset counter value {{{0}}} is visible")
  async checkAssetCountervalueVisible(currencyName: string, options: AssetRowOptions = {}) {
    if (options.inStablecoinList) {
      await this.assetItem(currencyName).scrollTo(this.stablecoinList);
    }
    await this.assetItemCountervalue(currencyName).expectVisible();
  }

  @Step("Open Wallet 4.0 asset detail {{{0}}}")
  async openAssetDetailW40(currencyName: string, options: AssetRowOptions = {}) {
    if (options.inStablecoinList) {
      await this.assetItem(currencyName).scrollTo(this.stablecoinList);
    }
    await this.assetItem(currencyName).expectVisible();
    await this.assetItem(currencyName).tap();
  }

  @Step("Open Wallet 4.0 stablecoins list")
  async openStablecoinsListW40() {
    await this.tapStablecoinsSectionTitle();
    await this.checkStablecoinListPageVisible();
  }

  @Step("Check if full stablecoin list page is visible")
  async isStablecoinListPageVisible(timeout = TIMEOUT.xxsmall) {
    return await this.stablecoinList.isVisible(timeout);
  }

  /**
   * Starts from the top of the list so the header is reached from below: a header already scrolled
   * up to the floating top bar would otherwise be pushed under it by revealForTap.
   */
  private async revealSectionHeader(header: NativeHandle) {
    await this.accountsList.waitVisible();
    await this.ensureHeroVisible(this.quickActionsCtas);
    await header.revealForTap(this.accountsList);
  }

  @Step("Tap cryptos section title")
  async tapCryptosSectionTitle() {
    await this.revealSectionHeader(this.cryptosSectionHeader);
    await this.cryptosSectionHeader.tap();
  }

  @Step("Tap stablecoins section title")
  async tapStablecoinsSectionTitle() {
    await this.revealSectionHeader(this.stablecoinsSectionHeader);
    await this.stablecoinsSectionHeader.tap();
  }

  private async checkListPageVisible(list: NativeHandle) {
    await list.waitVisible();
    await list.expectVisible();
  }

  @Step("Check full crypto list page is visible")
  async checkCryptoListPageVisible() {
    await this.checkListPageVisible(this.cryptoList);
  }

  @Step("Check full stablecoin list page is visible")
  async checkStablecoinListPageVisible() {
    await this.checkListPageVisible(this.stablecoinList);
  }

  private async scrollToStocksHeader(header: NativeHandle) {
    await header.waitExist(TIMEOUT.xxlarge);
    await header.scrollTo(this.accountsList);
  }

  @Step("Check stocks discovery (empty) section is visible")
  async checkStocksDiscoverySectionVisible() {
    await this.scrollToStocksHeader(this.stocksDiscoveryHeader);
    await this.stocksDiscovery.expectExist();
    await this.stocksDiscoveryHeader.expectVisible();
  }

  @Step("Tap 'Explore all' in the stocks discovery section")
  async tapStocksExploreAll() {
    await this.scrollToStocksHeader(this.stocksDiscoveryHeader);
    await this.stocksDiscoveryHeader.tap();
  }

  @Step("Check stocks holdings section is visible")
  async checkStocksHoldingsSectionVisible() {
    await this.scrollToStocksHeader(this.stocksSectionHeader);
    await this.stocksSectionHeader.expectVisible();
    await this.portfolioStocksList.expectExist();
  }

  @Step("Tap stocks section title")
  async tapStocksSectionTitle() {
    await this.scrollToStocksHeader(this.stocksSectionHeader);
    await this.stocksSectionHeader.tap();
  }

  @Step("Check full stocks list page is visible")
  async checkStocksListPageVisible() {
    await this.checkListPageVisible(this.stocksList);
  }

  @Step("Expect borrow entry point to be visible")
  async expectBorrowEntryPointVisible() {
    await this.borrowEntryPoint.scrollTo(this.accountsList);
    await this.borrowEntryPoint.waitVisible();
  }

  /**
   * The card and its CTA share one onPress, so tap the card rather than the nested button.
   * The card enters from the bottom, so it parks against the tab bar until revealForTap
   * continues past it.
   */
  @Step("Click borrow entry point")
  async clickBorrowEntryPoint() {
    await this.borrowEntryPoint.revealForTap(this.accountsList);
    await this.borrowEntryPoint.tap();
  }
}
