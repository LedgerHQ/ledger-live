import { getElementById, typeTextByElement, tapByText, tapByElement } from "../../helpers";

export default class MarketPage {
  searchBar = () => getElementById("search-box");
  starButton = () => getElementById("star-asset");
  assetCardBackBtn = () => getElementById("market-back-btn");
  starMarketListButton = () => getElementById("starred");
  buyAssetButton = () => getElementById("market-buy-btn");

  searchAsset(asset: string) {
    return typeTextByElement(this.searchBar(), asset);
  }

  openAssetPage(selectAsset: string) {
    return tapByText(selectAsset);
  }

  starFavoriteCoin() {
    return tapByElement(this.starButton());
  }

  backToAssetList() {
    return tapByElement(this.assetCardBackBtn());
  }

  filterStaredAsset() {
    return tapByElement(this.starMarketListButton());
  }

  buyAsset() {
    return tapByElement(this.buyAssetButton());
  }
}
