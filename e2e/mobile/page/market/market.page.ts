import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "@e2e/helpers/commonHelpers";

import { isAssetDiscoverabilityEnabled } from "@e2e/utils/featureFlagUtils";

import type { CurrencyType } from "@ledgerhq/live-e2e-shared/enum/Currency";

export default class MarketPage {
  marketScreenSearchBarId = "market-screen-search-bar";
  marketAssetsCategorySwitcherStarredId = "market-screen-assets-category-switcher-starred";
  marketRowTitleBaseId = "market-row-title-";
  marketItemId = (id: string) => `marketItem-${id}`;
  marketFilterSortButton = () => getElementById("market-filter-sort");
  marketFilterTimeButton = () => getElementById("market-filter-time");
  marketFilterCurrencyButton = () => getElementById("market-filter-currency");
  searchBarId = async () =>
    (await isAssetDiscoverabilityEnabled()) ? "market-screen-search-bar" : "search-box";
  marketRowTitle = (currency: CurrencyType) =>
    getElementById(`${this.marketRowTitleBaseId}${currency.ticker}`);
  marketScreenItemWithTitle = (marketId: string, title: string) =>
    getElementByIdWithDescendantTexts(this.marketItemId(marketId), title);
  starMarketListButton = () => getElementById("toggle-starred-currencies");
  marketListHeaderLeft = () => getElementById("market-list-header-left");

  marketCategorySwitcherId = "market-screen-assets-category-switcher";
  marketCategoryTabId = (value: string) => `${this.marketCategorySwitcherId}-${value}`;
  headerBackButtonId = "navigation-header-back-button";
  assetDetailScrollViewId = /^asset-detail-scroll-view-.*/;
  assetDetailCoinCapsuleId = "asset-detail-coin-capsule";
  assetDetailMarketPriceId = "asset-detail-market-price";
  assetDetailCoinOptionsTrailingId = "asset-detail-coin-options-trailing";

  marketScreenFilterButton = () => getElementById("market-screen-assets-filter-button");
  coinOptionsTrigger = () => getElementById("asset-detail-coin-options-trailing");
  coinOptionsFavouriteRow = () => getElementById("asset-detail-coin-options-favourite-row");
  // New MarketScreen keys rows by CoinGecko market.id; ERC20s differ from their ledger currency.id.
  marketScreenRow = (currency: CurrencyType) =>
    getElementById(this.marketItemId(currency.market?.id ?? currency.id));

  @Step("Go back from the market screen")
  async goBack() {
    await waitForElementById(this.headerBackButtonId);
    await tapByIdAndExpectToDisappear(this.headerBackButtonId);
  }

  @Step("Open market screen via deeplink")
  async openViaDeeplink() {
    await openDeeplink("market");
  }

  @Step("Expect asset page")
  async expectAssetPageVisible() {
    await waitForElementById(this.assetDetailScrollViewId);
    await detoxExpect(getElementById(this.assetDetailScrollViewId)).toBeVisible();
    await detoxExpect(getElementById(this.assetDetailMarketPriceId)).toBeVisible();
    await detoxExpect(getElementById(this.assetDetailCoinCapsuleId)).toBeVisible();
    await detoxExpect(getElementById(this.assetDetailCoinOptionsTrailingId)).toBeVisible();
  }

  @Step("Leave asset page")
  async leaveAssetPage() {
    await tapById(this.headerBackButtonId);
  }

  @Step("Expect market screen")
  async expectMarketScreenVisible() {
    await waitForElementById(this.marketScreenSearchBarId);
    await detoxExpect(getElementById(this.marketAssetsCategorySwitcherStarredId)).toBeVisible();
  }

  @Step("Expect market list header left")
  async goBackToPortfolio() {
    if (await isAssetDiscoverabilityEnabled()) {
      await this.goBack();
    } else {
      await tapByElement(this.marketListHeaderLeft());
    }
  }

  @Step("Search for asset {{{0}}}")
  async searchAsset(asset: string) {
    await typeTextByElement(getElementById(await this.searchBarId()), asset);
  }

  @Step("Open asset page {{{0.name}}}")
  async openAssetPage(currency: CurrencyType) {
    if (await isAssetDiscoverabilityEnabled()) {
      await tapByElement(this.marketScreenRow(currency));
    } else {
      await tapByElement(this.marketRowTitle(currency));
    }
  }

  @Step("Star favorite coin")
  async starFavoriteCoin() {
    await tapByElement(this.coinOptionsTrigger());
    await tapByElement(this.coinOptionsFavouriteRow());
  }

  @Step("Back to asset list")
  async backToAssetList() {
    await waitForElementById(this.headerBackButtonId);
    await tapById(this.headerBackButtonId);
    await waitForElementById(await this.searchBarId());
  }

  @Step("Filter starred asset")
  async filterStaredAsset() {
    if (await isAssetDiscoverabilityEnabled()) {
      // CategorySwitcher is hidden while search is active — clear search bar first
      await clearTextByElement(getElementById(await this.searchBarId()));
      await waitForElementById(this.marketCategoryTabId("starred"));
      await tapById(this.marketCategoryTabId("starred"));
    } else {
      await tapByElement(this.starMarketListButton());
    }
  }

  @Step("Filter starred assets on market screen")
  async filterStarredAssetsOnMarketScreen() {
    await waitForElementById(this.marketAssetsCategorySwitcherStarredId);
    await tapById(this.marketAssetsCategorySwitcherStarredId);
  }

  @Step("Expect market row title {{{0.name}}}")
  async expectMarketRowTitle(currency: CurrencyType) {
    if (await isAssetDiscoverabilityEnabled()) {
      await detoxExpect(this.marketScreenRow(currency)).toBeVisible();
    } else {
      await detoxExpect(this.marketRowTitle(currency)).toBeVisible();
    }
  }

  @Step("Check market screen item {{{0}}} is visible")
  async isMarketScreenItemVisible(marketId: string, title: string): Promise<boolean> {
    try {
      await waitForElement(this.marketScreenItemWithTitle(marketId, title));
      return true;
    } catch {
      return false;
    }
  }

  @Step("Tap on market quick action button {{{0}}}")
  async tapOnMarketQuickActionButton(action: "send" | "receive" | "buy" | "sell" | "swap") {
    const assetDetailTestIds: Partial<Record<typeof action, string>> = {
      buy: "asset-detail-buy-button",
      swap: "asset-detail-swap-button",
      receive: "asset-detail-footer-receive-button",
    };
    const testId = assetDetailTestIds[action] ?? `asset-quick-action-button-${action}`;
    await waitForElementById(testId);
    await tapById(testId);
  }

  @Step("Expect filters visible")
  async expectFiltersVisible() {
    if (await isAssetDiscoverabilityEnabled()) {
      await detoxExpect(this.marketScreenFilterButton()).toBeVisible();
    } else {
      await detoxExpect(this.marketFilterSortButton()).toBeVisible();
      await detoxExpect(this.marketFilterTimeButton()).toBeVisible();
      await detoxExpect(this.marketFilterCurrencyButton()).toBeVisible();
    }
  }

  @Step("Expect category tab {{{0}}} to be visible")
  async expectCategoryTabVisible(value: string) {
    await waitForElementById(this.marketCategoryTabId(value));
    await detoxExpect(getElementById(this.marketCategoryTabId(value))).toBeVisible();
  }

  @Step("Expect category {{{0}}} to be selected")
  async expectCategorySelected(value: string) {
    await this.expectCategoryTabVisible(value);
  }
}
