import { getElementById, openDeeplink, waitForElementById } from "../../helpers";

const baseLink = "accounts";

export default class accountsPage {
  accountTitle = (coin: string) => getElementById(`accounts-title-${coin}`);

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }
  async waitForAccountsPageToLoad() {
    await waitForElementById("accounts-list-title");
  }
}
