import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "@e2e/helpers/commonHelpers";

import type { CurrencyType } from "@ledgerhq/live-e2e-shared/enum/Currency";

export default class MarketPage {
  marketScreenSearchBarId = "market-screen-search-bar";
  marketAssetsCategorySwitcherStarredId = "market-screen-assets-category-switcher-starred";
  marketItemId = (id: string) => `marketItem-${id}`;
  marketScreenItemWithTitle = (marketId: string, title: string) =>
    getElementByIdWithDescendantTexts(this.marketItemId(marketId), title);

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
  async openViaDeeplink(currencyId?: string) {
    await openDeeplink(currencyId ? `market/${currencyId}` : "market");
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

  @Step("Go back to portfolio")
  async goBackToPortfolio() {
    await this.goBack();
  }

  @Step("Search for asset {{{0}}}")
  async searchAsset(asset: string) {
    await typeTextByElement(getElementById(this.marketScreenSearchBarId), asset);
  }

  @Step("Open asset page {{{0.name}}}")
  async openAssetPage(currency: CurrencyType) {
    await tapByElement(this.marketScreenRow(currency));
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
    await waitForElementById(this.marketScreenSearchBarId);
  }

  @Step("Filter starred asset")
  async filterStaredAsset() {
    // CategorySwitcher is hidden while search is active.
    await clearTextByElement(getElementById(this.marketScreenSearchBarId));
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
