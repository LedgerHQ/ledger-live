import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "@e2e/helpers/commonHelpers";
import { byId, byIdWithDescendantText } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";

import {
  isAssetDiscoverabilityEnabled,
  isAggregatedAssetsEnabled,
} from "@e2e/utils/featureFlagUtils";

import type { CurrencyType } from "@ledgerhq/live-e2e-shared/enum/Currency";

type MarketQuickAction = "send" | "receive" | "buy" | "sell" | "swap";

// The aggregated asset detail screen gives some quick actions their own testID.
const AGGREGATED_QUICK_ACTION_IDS: Partial<Record<MarketQuickAction, string>> = {
  buy: "asset-detail-buy-button",
  swap: "asset-detail-swap-button",
  receive: "asset-detail-footer-receive-button",
};

export default class MarketPage {
  private readonly marketScreenSearchBar = byId("market-screen-search-bar");
  private readonly legacySearchBar = byId("search-box");
  private readonly headerBackButton = byId("navigation-header-back-button");
  private readonly marketBackButton = byId("market-back-btn");
  private readonly marketListHeaderLeft = byId("market-list-header-left");
  private readonly starButton = byId("star-asset");
  private readonly starMarketListButton = byId("toggle-starred-currencies");
  private readonly filterSortButton = byId("market-filter-sort");
  private readonly filterTimeButton = byId("market-filter-time");
  private readonly filterCurrencyButton = byId("market-filter-currency");
  private readonly marketScreenFilterButton = byId("market-screen-assets-filter-button");
  private readonly assetDetailScrollView = byId(/^asset-detail-scroll-view-.*/);
  private readonly assetDetailCoinCapsule = byId("asset-detail-coin-capsule");
  private readonly assetDetailMarketPrice = byId("asset-detail-market-price");
  private readonly coinOptionsTrigger = byId("asset-detail-coin-options-trailing");
  private readonly coinOptionsFavouriteRow = byId("asset-detail-coin-options-favourite-row");
  private readonly assetDetailScrollViewFor = (currencyId: string) =>
    byId(`asset-detail-scroll-view-${currencyId.toLowerCase()}`);
  private readonly categoryTab = (value: string) =>
    byId(`market-screen-assets-category-switcher-${value}`);
  private readonly marketItem = (marketId: string) => byId(`marketItem-${marketId}`);
  private readonly marketItemWithTitle = (marketId: string, title: string) =>
    byIdWithDescendantText({ id: `marketItem-${marketId}`, text: title });
  // New MarketScreen keys rows by CoinGecko market.id; ERC20s differ from their ledger currency.id.
  private readonly marketScreenRow = (currency: CurrencyType) =>
    this.marketItem(currency.market?.id ?? currency.id);
  private readonly marketRowTitle = (currency: CurrencyType) =>
    byId(`market-row-title-${currency.ticker}`);
  private readonly marketQuickActionButton = (action: MarketQuickAction) =>
    byId(`market-quick-action-button-${action}`);
  private readonly aggregatedQuickActionButton = (action: MarketQuickAction) =>
    byId(AGGREGATED_QUICK_ACTION_IDS[action] ?? `asset-quick-action-button-${action}`);

  private async searchBar() {
    return (await isAssetDiscoverabilityEnabled())
      ? this.marketScreenSearchBar
      : this.legacySearchBar;
  }

  @Step("Go back from the market screen")
  async goBack() {
    await this.headerBackButton.tapUntilNotVisible();
  }

  @Step("Open market detail via deeplink {{{0}}}")
  async openViaDeeplink(currencyId?: string) {
    await openDeeplink(currencyId ? `market/${currencyId}` : "market");
  }

  @Step("Expect market detail page")
  async expectMarketDetailPage(currencyId?: string) {
    if (await isAggregatedAssetsEnabled()) {
      const scrollView = currencyId
        ? this.assetDetailScrollViewFor(currencyId)
        : this.assetDetailScrollView;
      await scrollView.waitVisible();
      await scrollView.expectVisible();
    } else {
      await this.starButton.expectVisible();
    }
  }

  @Step("Expect asset page")
  async expectAssetPageVisible() {
    if (await isAggregatedAssetsEnabled()) {
      await this.assetDetailScrollView.waitVisible();
      await this.assetDetailScrollView.expectVisible();
      await this.assetDetailMarketPrice.expectVisible();
      await this.assetDetailCoinCapsule.expectVisible();
      await this.coinOptionsTrigger.expectVisible();
    } else {
      await this.expectMarketDetailPage();
    }
  }

  @Step("Leave asset page")
  async leaveAssetPage() {
    if (await isAggregatedAssetsEnabled()) {
      await this.headerBackButton.tap();
    } else {
      await this.leaveMarketDetailPage();
    }
  }

  @Step("Expect market screen")
  async expectMarketScreenVisible() {
    await this.marketScreenSearchBar.waitVisible();
    await this.categoryTab("starred").expectVisible();
  }

  @Step("Expect market list header left")
  async goBackToPortfolio() {
    if (await isAssetDiscoverabilityEnabled()) {
      await this.goBack();
    } else {
      await this.marketListHeaderLeft.tap();
    }
  }

  @Step("Leave market detail page")
  async leaveMarketDetailPage() {
    if (await isAggregatedAssetsEnabled()) {
      await this.headerBackButton.tap();
    } else {
      await this.marketBackButton.tap(TIMEOUT.small);
    }
  }

  @Step("Search for asset {{{0}}}")
  async searchAsset(asset: string) {
    await (await this.searchBar()).replaceText(asset);
  }

  @Step("Open asset page {{{0.name}}}")
  async openAssetPage(currency: CurrencyType) {
    if (await isAssetDiscoverabilityEnabled()) {
      await this.marketScreenRow(currency).tap();
    } else {
      await this.marketRowTitle(currency).tap();
    }
  }

  @Step("Star favorite coin")
  async starFavoriteCoin() {
    if (await isAggregatedAssetsEnabled()) {
      await this.coinOptionsTrigger.tap();
      await this.coinOptionsFavouriteRow.tap();
    } else {
      await this.starButton.tap();
    }
  }

  @Step("Back to asset list")
  async backToAssetList() {
    if (await isAggregatedAssetsEnabled()) {
      await this.headerBackButton.tap();
      await (await this.searchBar()).waitVisible();
    } else {
      await this.marketBackButton.tap();
    }
  }

  @Step("Filter starred asset")
  async filterStaredAsset() {
    if (await isAssetDiscoverabilityEnabled()) {
      // CategorySwitcher is hidden while search is active — clear search bar first
      await (await this.searchBar()).clearText();
      await this.categoryTab("starred").tap();
    } else {
      await this.starMarketListButton.tap();
    }
  }

  @Step("Filter starred assets on market screen")
  async filterStarredAssetsOnMarketScreen() {
    await this.categoryTab("starred").tap();
  }

  @Step("Expect market row title {{{0.name}}}")
  async expectMarketRowTitle(currency: CurrencyType) {
    if (await isAssetDiscoverabilityEnabled()) {
      await this.marketScreenRow(currency).expectVisible();
    } else {
      await this.marketRowTitle(currency).expectVisible();
    }
  }

  @Step("Check market screen item {{{0}}} is visible")
  async isMarketScreenItemVisible(marketId: string, title: string): Promise<boolean> {
    return await this.marketItemWithTitle(marketId, title).isVisible(TIMEOUT.xxlarge);
  }

  @Step("Tap on market quick action button {{{0}}}")
  async tapOnMarketQuickActionButton(action: MarketQuickAction) {
    if (await isAggregatedAssetsEnabled()) {
      await this.aggregatedQuickActionButton(action).tap();
    } else {
      await this.marketQuickActionButton(action).tap();
    }
  }

  @Step("Expect filters visible")
  async expectFiltersVisible() {
    if (await isAssetDiscoverabilityEnabled()) {
      await this.marketScreenFilterButton.expectVisible();
    } else {
      await this.filterSortButton.expectVisible();
      await this.filterTimeButton.expectVisible();
      await this.filterCurrencyButton.expectVisible();
    }
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
