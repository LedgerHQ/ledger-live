import { Step } from "jest-allure2-reporter/api";
import { escapeRegExp, openDeeplink } from "@e2e/helpers/commonHelpers";
import { byId, byIdWithDescendantText } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";

import type { CurrencyType } from "@ledgerhq/live-e2e-shared/enum/Currency";

type MarketQuickAction = "send" | "receive" | "buy" | "sell" | "swap";

// The asset detail screen gives some quick actions their own testID.
const ASSET_DETAIL_QUICK_ACTION_IDS: Partial<Record<MarketQuickAction, string>> = {
  buy: "asset-detail-buy-button",
  swap: "asset-detail-swap-button",
  receive: "asset-detail-footer-receive-button",
};

export default class MarketPage {
  private readonly marketScreenSearchBar = byId("market-screen-search-bar");
  private readonly headerBackButton = byId("navigation-header-back-button");
  private readonly marketScreenFilterButton = byId("market-screen-assets-filter-button");
  private readonly assetDetailScrollView = byId(/^asset-detail-scroll-view-.*/);
  private readonly assetDetailCoinCapsule = byId("asset-detail-coin-capsule");
  private readonly assetDetailMarketPrice = byId("asset-detail-market-price");
  private readonly coinOptionsTrigger = byId("asset-detail-coin-options-trailing");
  private readonly coinOptionsFavouriteRow = byId("asset-detail-coin-options-favourite-row");
  private readonly categoryTab = (value: string) =>
    byId(`market-screen-assets-category-switcher-${value}`);
  private readonly marketItem = (marketId: string) => byId(`marketItem-${marketId}`);
  // Matches the title anywhere in a descendant, ignoring case.
  private readonly marketItemWithTitle = (marketId: string, title: string) =>
    byIdWithDescendantText({
      id: `marketItem-${marketId}`,
      text: new RegExp(`.*${escapeRegExp(title)}.*`, "i"),
    });
  // New MarketScreen keys rows by CoinGecko market.id; ERC20s differ from their ledger currency.id.
  private readonly marketScreenRow = (currency: CurrencyType) =>
    this.marketItem(currency.market?.id ?? currency.id);
  private readonly quickActionButton = (action: MarketQuickAction) =>
    byId(ASSET_DETAIL_QUICK_ACTION_IDS[action] ?? `asset-quick-action-button-${action}`);

  @Step("Go back from the market screen")
  async goBack() {
    // The header slides in with the screen: at 100% the push has settled, so the tap is not lost.
    await this.headerBackButton.waitFullyVisible();
    await this.headerBackButton.tap();
    await this.headerBackButton.waitNotVisible();
  }

  @Step("Open market screen via deeplink")
  async openViaDeeplink(currencyId?: string) {
    await openDeeplink(currencyId ? `market/${currencyId}` : "market");
  }

  @Step("Expect asset page")
  async expectAssetPageVisible() {
    await this.assetDetailScrollView.waitVisible();
    await this.assetDetailScrollView.expectVisible();
    await this.assetDetailMarketPrice.expectVisible();
    await this.assetDetailCoinCapsule.expectVisible();
    await this.coinOptionsTrigger.expectVisible();
  }

  @Step("Leave asset page")
  async leaveAssetPage() {
    await this.headerBackButton.tap();
  }

  @Step("Expect market screen")
  async expectMarketScreenVisible() {
    await this.marketScreenSearchBar.waitVisible();
    await this.categoryTab("starred").expectVisible();
  }

  @Step("Go back to portfolio")
  async goBackToPortfolio() {
    await this.goBack();
  }

  @Step("Search for asset {{{0}}}")
  async searchAsset(asset: string) {
    await this.marketScreenSearchBar.replaceText(asset);
  }

  @Step("Open asset page {{{0.name}}}")
  async openAssetPage(currency: CurrencyType) {
    await this.marketScreenRow(currency).tap();
  }

  @Step("Star favorite coin")
  async starFavoriteCoin() {
    await this.coinOptionsTrigger.tap();
    await this.coinOptionsFavouriteRow.tap();
  }

  @Step("Back to asset list")
  async backToAssetList() {
    await this.headerBackButton.tap();
    await this.marketScreenSearchBar.waitVisible();
  }

  @Step("Filter starred asset")
  async filterStaredAsset() {
    // CategorySwitcher is hidden while search is active.
    await this.marketScreenSearchBar.clearText();
    await this.categoryTab("starred").tap();
  }

  @Step("Filter starred assets on market screen")
  async filterStarredAssetsOnMarketScreen() {
    await this.categoryTab("starred").tap();
  }

  @Step("Expect market row title {{{0.name}}}")
  async expectMarketRowTitle(currency: CurrencyType) {
    await this.marketScreenRow(currency).expectVisible();
  }

  @Step("Check market screen item {{{0}}} is visible")
  async isMarketScreenItemVisible(marketId: string, title: string): Promise<boolean> {
    return await this.marketItemWithTitle(marketId, title).isVisible(TIMEOUT.xxlarge);
  }

  @Step("Tap on market quick action button {{{0}}}")
  async tapOnMarketQuickActionButton(action: MarketQuickAction) {
    await this.quickActionButton(action).tap();
  }

  @Step("Expect filters visible")
  async expectFiltersVisible() {
    await this.marketScreenFilterButton.expectVisible();
  }

  @Step("Expect category tab {{{0}}} to be visible")
  async expectCategoryTabVisible(value: string) {
    await this.categoryTab(value).waitVisible();
    await this.categoryTab(value).expectVisible();
  }

  @Step("Expect category {{{0}}} to be selected")
  async expectCategorySelected(value: string) {
    await this.expectCategoryTabVisible(value);
  }
}
