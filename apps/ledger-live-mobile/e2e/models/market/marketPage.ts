import {
  getElementById,
  getElementByText,
  typeTextByElement,
  tapByText,
  tapByElement,
} from "../../helpers";

export default class marketPage {
  searchBar = () => getElementById("search-box");
  starBtn = () => getElementById("starAsset");
  assetCardBtnBack = () => getElementByText("Bitcoin");
  assetCardBackBtn = () => getElementById("marketBackBtn");
  starMarketListBtn = () => getElementById("stared");
  buyNanoBtn = () => getElementById("testIDBuyBtn");
  openMarketPlaceBtn = () => getElementById("marketPlaceBtn");

  async searchAsset(asset: string) {
    await typeTextByElement(this.searchBar(), asset);
  }

  async openAssetPage(selectAsset: string) {
    await tapByText(selectAsset);
  }

  async starFavoriteCoin() {
    await tapByElement(this.starBtn());
  }

  async backToAssetList() {
    await tapByElement(this.assetCardBackBtn());
  }

  async filterStaredAsset() {
    await tapByElement(this.starMarketListBtn());
  }

  async buyNano() {
    await tapByElement(this.buyNanoBtn());
  }

  async openMarketPlace() {
    await tapByElement(this.openMarketPlaceBtn());
  }
}
