import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "../../helpers/commonHelpers";

export default class MarketPage {
  marketRowTitleBaseId = "market-row-title-";
  marketFilterSortButton = () => getElementById("market-filter-sort");
  marketFilterTimeButton = () => getElementById("market-filter-time");
  marketFilterCurrencyButton = () => getElementById("market-filter-currency");
  searchBar = () => getElementById("search-box");
  starButton = () => getElementById("star-asset");
  assetDetailBackBtn = () => getElementById("market-back-btn");
  marketRowTitle = (ticker: string) => getElementById(`${this.marketRowTitleBaseId}${ticker}`);
  starMarketListButton = () => getElementById("toggle-starred-currencies");
  marketQuickActionButton = (action: "send" | "receive" | "buy" | "sell" | "swap") =>
    getElementById(`market-quick-action-button-${action}`);
  marketListHeaderLeft = () => getElementById("market-list-header-left");

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
    await tapByElement(this.marketListHeaderLeft());
  }

  @Step("Leave market detail page")
  async leaveMarketDetailPage() {
    await tapByElement(this.assetDetailBackBtn());
  }

  @Step("Search for asset")
  async searchAsset(asset: string) {
    await typeTextByElement(this.searchBar(), asset);
  }

  @Step("Open asset page")
  async openAssetPage(ticker: string) {
    await tapByElement(this.marketRowTitle(ticker));
  }

  @Step("Star favorite coin")
  async starFavoriteCoin() {
    await tapByElement(this.starButton());
  }

  @Step("Back to asset list")
  async backToAssetList() {
    await tapByElement(this.assetDetailBackBtn());
  }

  @Step("Filter starred asset")
  async filterStaredAsset() {
    await tapByElement(this.starMarketListButton());
  }

  @Step("Expect market row title")
  async expectMarketRowTitle(ticker: string) {
    await detoxExpect(this.marketRowTitle(ticker)).toBeVisible();
  }

  @Step("Tap on market quick action button ")
  async tapOnMarketQuickActionButton(action: "send" | "receive" | "buy" | "sell" | "swap") {
    await tapByElement(this.marketQuickActionButton(action));
  }

  @Step("Expect filters visible")
  async expectFiltersVisible() {
    await detoxExpect(this.marketFilterSortButton()).toBeVisible();
    await detoxExpect(this.marketFilterTimeButton()).toBeVisible();
    await detoxExpect(this.marketFilterCurrencyButton()).toBeVisible();
  }
}
