import { getElementById, openDeeplink, waitForElementById, tapByElement } from "../../helpers";

const baseLink = "accounts";

export default class AccountsPage {
  accountTitleId = (coin: string) => `accounts-title-${coin}`;
  addAccountButton = () => getElementById("add-account-button");
  listTitle = "accounts-list-title";

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }
  async waitForAccountsPageToLoad() {
    await waitForElementById(this.listTitle);
  }
  async waitForAccountsCoinPageToLoad(coin: string) {
    await waitForElementById(this.accountTitleId(coin));
  }

  async addAccount() {
    await tapByElement(this.addAccountButton());
  }
}
