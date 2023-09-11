import {
  getElementById,
  tapById,
  waitForElementById,
  typeTextByElement,
  tapByText,
} from "../helpers";

export default class depositPage {
  searchBar = () => getElementById("common-search-field");

  searchAsset(asset: string) {
    return typeTextByElement(this.searchBar(), asset);
  }

  selectAsset(asset: string) {
    return tapByText(asset);
  }

  selectAccount(account: string) {
    return tapByText(account);
  }
}
