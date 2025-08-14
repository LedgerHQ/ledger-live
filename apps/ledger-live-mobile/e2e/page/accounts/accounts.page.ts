import CommonPage from "../common.page";

export default class AccountsPage extends CommonPage {
  baseLink = "accounts";
  listTitle = "accounts-list-title";

  async waitForAccountsPageToLoad() {
    await waitForElementById(this.listTitle);
  }
}
