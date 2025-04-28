import { expect } from "detox";

export default class MarketPage {
  searchBar = () => getElementById("search-box");
  starButton = () => getElementById("star-asset");
  assetCardBackBtn = () => getElementById("market-back-btn");
  marketRowTitle = (index = 0) => getElementById("market-row-title", index);
  starMarketListButton = () => getElementById("toggle-starred-currencies");
  buyAssetButton = () => getElementById("market-buy-btn");

  async searchAsset(asset: string) {
    await typeTextByElement(await this.searchBar(), asset);
  }

  async openAssetPage(selectAsset: string) {
    await tapByText(selectAsset);
  }

  async starFavoriteCoin() {
    await tapByElement(await this.starButton());
  }

  async backToAssetList() {
    await tapByElement(await this.assetCardBackBtn());
  }

  async filterStaredAsset() {
    await tapByElement(await this.starMarketListButton());
  }

  async buyAsset() {
    await tapByElement(await this.buyAssetButton());
  }

  async expectMarketRowTitle(title: string) {
    await expect(await this.marketRowTitle()).toHaveText(title);
  }
}
