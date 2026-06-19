import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "../../helpers/commonHelpers";
import { getFlags } from "../../bridge/server";
import type { Features } from "@shared/feature-flags";

export default class MarketPage {
  marketRowTitleBaseId = "market-row-title-";
  marketFilterSortButton = () => getElementById("market-filter-sort");
  marketFilterTimeButton = () => getElementById("market-filter-time");
  marketFilterCurrencyButton = () => getElementById("market-filter-currency");
  searchBar = () => getElementById("search-box");
  starButton = () => getElementById("star-asset");
  backButtonId = "market-back-btn";
  assetDetailBackBtn = () => getElementById(this.backButtonId);
  marketRowTitle = (ticker: string) => getElementById(`${this.marketRowTitleBaseId}${ticker}`);
  starMarketListButton = () => getElementById("toggle-starred-currencies");
  marketQuickActionButton = (action: "send" | "receive" | "buy" | "sell" | "swap") =>
    getElementById(`market-quick-action-button-${action}`);
  marketListHeaderLeft = () => getElementById("market-list-header-left");

  marketCategorySwitcherId = "market-screen-assets-category-switcher";
  marketCategoryTabId = (value: string) => `${this.marketCategorySwitcherId}-${value}`;
  headerBackButtonId = "navigation-header-back-button";

  // New (asset discoverability) MarketScreen / AssetDetail test ids — see
  // apps/ledger-live-mobile/src/mvvm/features/Market/screens/MarketScreen/testIds.ts
  // and apps/ledger-live-mobile/src/mvvm/features/AssetDetail/testIds.ts
  marketScreenFilterButton = () => getElementById("market-screen-assets-filter-button");
  coinOptionsTrigger = () => getElementById("asset-detail-coin-options-trailing");
  coinOptionsFavouriteRow = () => getElementById("asset-detail-coin-options-favourite-row");
  marketScreenRow = (ticker: string) =>
    getElementById(`marketItem-${this.marketIdForTicker(ticker)}`);

  // The new MarketScreen keys rows by ledger currency id, not ticker.
  marketIdByTicker: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
    SOL: "solana",
    XRP: "ripple",
    ADA: "cardano",
    DOT: "polkadot",
  };

  private marketIdForTicker(ticker: string): string {
    return this.marketIdByTicker[ticker.toUpperCase()] ?? ticker.toLowerCase();
  }

  private flags: Features["lwmWallet40"] | null = null;

  resetFlags(): void {
    this.flags = null;
  }

  private async loadFlags(): Promise<void> {
    this.flags ??= JSON.parse(await getFlags()).lwmWallet40;
  }

  // Gates the new market list / categories / search screens.
  private async isAssetDiscoverabilityEnabled(): Promise<boolean> {
    await this.loadFlags();
    return !!this.flags?.enabled && !!this.flags?.params?.assetDiscoverability;
  }

  // Gates the destination of a market row tap: the new MVVM AssetDetail screen
  // (with coin-options) when on, the legacy MarketDetail screen when off. This is
  // a different flag from `assetDiscoverability` (see useAssetDetailNavigation).
  private async isAggregatedAssetsEnabled(): Promise<boolean> {
    await this.loadFlags();
    return !!this.flags?.enabled && !!this.flags?.params?.aggregatedAssets;
  }

  @Step("Go back from the market screen")
  async goBack() {
    await waitForElementById(this.headerBackButtonId);
    await tapByIdAndExpectToDisappear(this.headerBackButtonId);
  }

  @Step("Open market detail via deeplink")
  async openViaDeeplink(currencyId?: string) {
    await openDeeplink(currencyId ? `market/${currencyId}` : "market");
  }

  @Step("Expect market detail page")
  async expectMarketDetailPage() {
    await detoxExpect(this.starButton()).toBeVisible();
  }

  @Step("Expect market list header left")
  async goBackToPortfolio() {
    if (await this.isAssetDiscoverabilityEnabled()) {
      await this.goBack();
    } else {
      await tapByElement(this.marketListHeaderLeft());
    }
  }

  @Step("Leave market detail page")
  async leaveMarketDetailPage() {
    await waitForElementById(this.backButtonId, 5000);
    await tapById(this.backButtonId);
  }

  @Step("Search for asset")
  async searchAsset(asset: string) {
    await typeTextByElement(this.searchBar(), asset);
  }

  @Step("Open asset page")
  async openAssetPage(ticker: string) {
    if (await this.isAssetDiscoverabilityEnabled()) {
      await tapByElement(this.marketScreenRow(ticker));
    } else {
      await tapByElement(this.marketRowTitle(ticker));
    }
  }

  @Step("Star favorite coin")
  async starFavoriteCoin() {
    if (await this.isAggregatedAssetsEnabled()) {
      await tapByElement(this.coinOptionsTrigger());
      await tapByElement(this.coinOptionsFavouriteRow());
    } else {
      await tapByElement(this.starButton());
    }
  }

  @Step("Back to asset list")
  async backToAssetList() {
    if (await this.isAggregatedAssetsEnabled()) {
      await this.goBack();
    } else {
      await tapByElement(this.assetDetailBackBtn());
    }
  }

  @Step("Filter starred asset")
  async filterStaredAsset() {
    if (await this.isAssetDiscoverabilityEnabled()) {
      await tapById(this.marketCategoryTabId("starred"));
    } else {
      await tapByElement(this.starMarketListButton());
    }
  }

  @Step("Expect market row title")
  async expectMarketRowTitle(ticker: string) {
    if (await this.isAssetDiscoverabilityEnabled()) {
      await detoxExpect(this.marketScreenRow(ticker)).toBeVisible();
    } else {
      await detoxExpect(this.marketRowTitle(ticker)).toBeVisible();
    }
  }

  @Step("Tap on market quick action button ")
  async tapOnMarketQuickActionButton(action: "send" | "receive" | "buy" | "sell" | "swap") {
    await tapByElement(this.marketQuickActionButton(action));
  }

  @Step("Expect filters visible")
  async expectFiltersVisible() {
    if (await this.isAssetDiscoverabilityEnabled()) {
      await detoxExpect(this.marketScreenFilterButton()).toBeVisible();
    } else {
      await detoxExpect(this.marketFilterSortButton()).toBeVisible();
      await detoxExpect(this.marketFilterTimeButton()).toBeVisible();
      await detoxExpect(this.marketFilterCurrencyButton()).toBeVisible();
    }
  }

  @Step("Expect category tab $0 to be visible")
  async expectCategoryTabVisible(value: string) {
    await waitForElementById(this.marketCategoryTabId(value));
    await detoxExpect(getElementById(this.marketCategoryTabId(value))).toBeVisible();
  }

  @Step("Expect category tab $0 to be selected")
  async expectCategorySelected(value: string) {
    await this.expectCategoryTabVisible(value);
  }
}
