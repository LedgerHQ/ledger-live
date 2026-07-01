import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "../../helpers/commonHelpers";

import {
  isAssetDiscoverabilityEnabled,
  isAggregatedAssetsEnabled,
} from "../../utils/featureFlagUtils";

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
  starButton = () => getElementById("star-asset");
  backButtonId = "market-back-btn";
  assetDetailBackBtn = () => getElementById(this.backButtonId);
  marketRowTitle = (currency: CurrencyType) =>
    getElementById(`${this.marketRowTitleBaseId}${currency.ticker}`);
  marketScreenItemWithTitle = (marketId: string, title: string) =>
    getElementByIdWithDescendantTexts(this.marketItemId(marketId), title);
  starMarketListButton = () => getElementById("toggle-starred-currencies");
  marketQuickActionButton = (action: "send" | "receive" | "buy" | "sell" | "swap") =>
    getElementById(`market-quick-action-button-${action}`);
  marketListHeaderLeft = () => getElementById("market-list-header-left");

  marketCategorySwitcherId = "market-screen-assets-category-switcher";
  marketCategoryTabId = (value: string) => `${this.marketCategorySwitcherId}-${value}`;
  headerBackButtonId = "navigation-header-back-button";
  assetDetailScrollViewId = "asset-detail-scroll-view";
  assetDetailCoinCapsuleId = "asset-detail-coin-capsule";
  assetDetailMarketPriceId = "asset-detail-market-price";
  assetDetailCoinOptionsTrailingId = "asset-detail-coin-options-trailing";

  marketScreenFilterButton = () => getElementById("market-screen-assets-filter-button");
  coinOptionsTrigger = () => getElementById("asset-detail-coin-options-trailing");
  coinOptionsFavouriteRow = () => getElementById("asset-detail-coin-options-favourite-row");
  // The new MarketScreen keys rows by ledger currency id, the legacy list by ticker.
  marketScreenRow = (currency: CurrencyType) => getElementById(this.marketItemId(currency.id));

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
    if (await isAssetDiscoverabilityEnabled()) {
      await this.goBack();
    } else {
      await tapByElement(this.marketListHeaderLeft());
    }
  }

  @Step("Leave market detail page")
  async leaveMarketDetailPage() {
    if (await isAggregatedAssetsEnabled()) {
      await waitForElementById(this.headerBackButtonId);
      await tapById(this.headerBackButtonId);
    } else {
      await waitForElementById(this.backButtonId, 5000);
      await tapById(this.backButtonId);
    }
  }

  @Step("Search for asset")
  async searchAsset(asset: string) {
    await typeTextByElement(getElementById(await this.searchBarId()), asset);
  }

  @Step("Open asset page")
  async openAssetPage(currency: CurrencyType) {
    if (await isAssetDiscoverabilityEnabled()) {
      await tapByElement(this.marketScreenRow(currency));
    } else {
      await tapByElement(this.marketRowTitle(currency));
    }
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

  @Step("Expect market row title")
  async expectMarketRowTitle(currency: CurrencyType) {
    if (await isAssetDiscoverabilityEnabled()) {
      await detoxExpect(this.marketScreenRow(currency)).toBeVisible();
    } else {
      await detoxExpect(this.marketRowTitle(currency)).toBeVisible();
    }
  }

  @Step("Check market screen item is visible")
  async isMarketScreenItemVisible(marketId: string, title: string): Promise<boolean> {
    try {
      await waitForElement(this.marketScreenItemWithTitle(marketId, title));
      return true;
    } catch {
      return false;
    }
  }

  @Step("Tap on market quick action button ")
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
    if (await isAssetDiscoverabilityEnabled()) {
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

  @Step("Expect category $0 to be selected")
  async expectCategorySelected(value: string) {
    await this.expectCategoryTabVisible(value);
  }
}
