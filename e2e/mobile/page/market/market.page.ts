import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "@e2e/helpers/commonHelpers";
import { TIMEOUT } from "@e2e/utils/timeouts";

import { isAggregatedAssetsEnabled } from "@e2e/utils/featureFlagUtils";

import type { CurrencyType } from "@ledgerhq/live-e2e-shared/enum/Currency";

export default class MarketPage {
  marketScreenSearchBarId = "market-screen-search-bar";
  marketAssetsCategorySwitcherStarredId = "market-screen-assets-category-switcher-starred";
  marketRowTitleBaseId = "market-row-title-";
  marketItemId = (id: string) => `marketItem-${id}`;
  searchBarId = () => this.marketScreenSearchBarId;
  starButton = () => getElementById("star-asset");
  backButtonId = "market-back-btn";
  assetDetailBackBtn = () => getElementById(this.backButtonId);
  marketRowTitle = (currency: CurrencyType) =>
    getElementById(`${this.marketRowTitleBaseId}${currency.ticker}`);
  marketScreenItemWithTitle = (marketId: string, title: string) =>
    getElementByIdWithDescendantTexts(this.marketItemId(marketId), title);
  marketQuickActionButton = (action: "send" | "receive" | "buy" | "sell" | "swap") =>
    getElementById(`market-quick-action-button-${action}`);

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

  @Step("Open market detail via deeplink {{{0}}}")
  async openViaDeeplink(currencyId?: string) {
    await openDeeplink(currencyId ? `market/${currencyId}` : "market");
  }

  @Step("Expect market detail page")
  async expectMarketDetailPage(currencyId?: string) {
    if (await isAggregatedAssetsEnabled()) {
      const scrollViewId = currencyId
        ? `asset-detail-scroll-view-${currencyId.toLowerCase()}`
        : /^asset-detail-scroll-view-.*/;
      await waitForElementById(scrollViewId);
    } else {
      await detoxExpect(this.starButton()).toBeVisible();
    }
  }

  @Step("Expect asset page")
  async expectAssetPageVisible() {
    if (await isAggregatedAssetsEnabled()) {
      await waitForElementById(this.assetDetailScrollViewId);
      await detoxExpect(getElementById(this.assetDetailScrollViewId)).toBeVisible();
      await detoxExpect(getElementById(this.assetDetailMarketPriceId)).toBeVisible();
      await detoxExpect(getElementById(this.assetDetailCoinCapsuleId)).toBeVisible();
      await detoxExpect(getElementById(this.assetDetailCoinOptionsTrailingId)).toBeVisible();
    } else {
      await this.expectMarketDetailPage();
    }
  }

  @Step("Leave asset page")
  async leaveAssetPage() {
    if (await isAggregatedAssetsEnabled()) {
      await tapById(this.headerBackButtonId);
    } else {
      await this.leaveMarketDetailPage();
    }
  }

  @Step("Expect market screen")
  async expectMarketScreenVisible() {
    await waitForElementById(this.marketScreenSearchBarId);
    await detoxExpect(getElementById(this.marketAssetsCategorySwitcherStarredId)).toBeVisible();
  }

  @Step("Expect market list header left")
  async goBackToPortfolio() {
    await this.goBack();
  }

  @Step("Leave market detail page")
  async leaveMarketDetailPage() {
    if (await isAggregatedAssetsEnabled()) {
      await waitForElementById(this.headerBackButtonId);
      await tapById(this.headerBackButtonId);
    } else {
      await waitForElementById(this.backButtonId, TIMEOUT.small);
      await tapById(this.backButtonId);
    }
  }

  @Step("Search for asset {{{0}}}")
  async searchAsset(asset: string) {
    await typeTextByElement(getElementById(await this.searchBarId()), asset);
  }

  @Step("Open asset page {{{0.name}}}")
  async openAssetPage(currency: CurrencyType) {
    await tapByElement(this.marketScreenRow(currency));
  }

  @Step("Star favorite coin")
  async starFavoriteCoin() {
    if (await isAggregatedAssetsEnabled()) {
      await tapByElement(this.coinOptionsTrigger());
      await tapByElement(this.coinOptionsFavouriteRow());
    } else {
      await tapByElement(this.starButton());
    }
  }

  @Step("Back to asset list")
  async backToAssetList() {
    if (await isAggregatedAssetsEnabled()) {
      await waitForElementById(this.headerBackButtonId);
      await tapById(this.headerBackButtonId);
      await waitForElementById(await this.searchBarId());
    } else {
      await tapByElement(this.assetDetailBackBtn());
    }
  }

  @Step("Filter starred asset")
  async filterStaredAsset() {
    // CategorySwitcher is hidden while search is active — clear search bar first
    await clearTextByElement(getElementById(await this.searchBarId()));
    await waitForElementById(this.marketCategoryTabId("starred"));
    await tapById(this.marketCategoryTabId("starred"));
  }

  @Step("Filter starred assets on market screen")
  async filterStarredAssetsOnMarketScreen() {
    await waitForElementById(this.marketAssetsCategorySwitcherStarredId);
    await tapById(this.marketAssetsCategorySwitcherStarredId);
  }

  @Step("Expect market row title {{{0.name}}}")
  async expectMarketRowTitle(currency: CurrencyType) {
    await detoxExpect(this.marketScreenRow(currency)).toBeVisible();
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
    if (await isAggregatedAssetsEnabled()) {
      const q2TestIds: Partial<Record<typeof action, string>> = {
        buy: "asset-detail-buy-button",
        swap: "asset-detail-swap-button",
        receive: "asset-detail-footer-receive-button",
      };
      const testId = q2TestIds[action] ?? `asset-quick-action-button-${action}`;
      await waitForElementById(testId);
      await tapById(testId);
    } else {
      await tapByElement(this.marketQuickActionButton(action));
    }
  }

  @Step("Expect filters visible")
  async expectFiltersVisible() {
    await detoxExpect(this.marketScreenFilterButton()).toBeVisible();
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
