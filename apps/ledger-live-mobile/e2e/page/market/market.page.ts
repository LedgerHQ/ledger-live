import { expect } from "detox";

export default class MarketPage {
  searchBar = () => getElementById("search-box");
  starButton = () => getElementById("star-asset");
  assetCardBackBtn = () => getElementById("market-back-btn");
  marketRowTitle = (index = 0) => getElementById("market-row-title", index);
  starMarketListButton = () => getElementById("toggle-starred-currencies");
  buyAssetButton = () => getElementById("market-buy-btn");

  async searchAsset(asset: string) {
    await typeTextByElement(this.searchBar(), asset);
  }

  async openAssetPage(selectAsset: string) {
    await tapByText(selectAsset);
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

  async expectMarketRowTitle(title: string) {
    await expect(this.marketRowTitle()).toHaveText(title);
  }
}
