import { getElementById, typeTextByElement, waitForElementById } from "../helpers";

export default class CommonPage {
  searchBarId = "common-search-field";
  searchBar = () => getElementById(this.searchBarId);

  async performSearch(text: string) {
    await waitForElementById(this.searchBarId);
    return typeTextByElement(this.searchBar(), text, false);
  }
}
