import { getElementById, tapById, typeTextByElement, waitForElementById } from "../helpers";
import { expect } from "detox";

export default class CommonPage {
  searchBarId = "common-search-field";
  searchBar = () => getElementById(this.searchBarId);
  successCloseButtonId = "success-close-button";

  accoundCardId = (id: string) => "account-card-" + id;

  async performSearch(text: string) {
    await waitForElementById(this.searchBarId);
    await typeTextByElement(this.searchBar(), text, false);
  }

  async expectSearch(text: string) {
    await expect(this.searchBar()).toHaveText(text);
  }

  async successClose() {
    await waitForElementById(this.successCloseButtonId);
    await tapById(this.successCloseButtonId);
  }

  async selectAccount(accountId: string) {
    const id = this.accoundCardId(accountId);
    await waitForElementById(id);
    await tapById(id);
  }
}
