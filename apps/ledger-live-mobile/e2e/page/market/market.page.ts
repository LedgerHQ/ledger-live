import { expect } from "detox";

export default class MarketPage {
  marketRowTitleBaseId = "market-row-title-";
  searchBar = () => getElementById("search-box");
  starButton = () => getElementById("star-asset");
  assetCardBackBtn = () => getElementById("market-back-btn");
  marketRowTitle = (ticker: string) => getElementById(`${this.marketRowTitleBaseId}${ticker}`);

  starMarketListButton = () => getElementById("toggle-starred-currencies");
  buyAssetButton = () => getElementById("market-buy-btn");

  async searchAsset(asset: string) {
    await typeTextByElement(this.searchBar(), asset);
  }

  async openAssetPage(ticker: string) {
    await tapByElement(this.marketRowTitle(ticker));
  }

  async starFavoriteCoin() {
    await tapByElement(this.starButton());
  }

  async backToAssetList() {
    await tapByElement(this.assetCardBackBtn());
  }

  async filterStaredAsset() {
    await tapByElement(this.starMarketListButton());
  }

  async buyAsset() {
    await tapByElement(this.buyAssetButton());
  }

  async expectMarketRowTitle(ticker: string) {
    await expect(this.marketRowTitle(ticker)).toBeVisible();
  }
}
