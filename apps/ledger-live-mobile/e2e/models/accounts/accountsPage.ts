import { getElementById, openDeeplink, waitForElementById, tapByElement } from "../../helpers";

const baseLink = "accounts";

export default class accountsPage {
  accountTitle = (coin: string) => getElementById(`accounts-title-${coin}`);
  addAccountCta = () => getElementById("add-account-cta");

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }
  async waitForAccountsPageToLoad() {
    await waitForElementById("accounts-list-title");
  }
  async waitForAccountsCoinPageToLoad(coin: string) {
    await waitForElementById(`accounts-title-${coin}`);
  }

  async addAccount() {
    await tapByElement(this.addAccountCta());
  }
}
