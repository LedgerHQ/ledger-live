import { getElementById, openDeeplink, waitForElementByID } from "../../helpers";

const baseLink = "accounts";

export default class accountsPage {
  accountTitle = (coin: string) => getElementById(`accounts-title-${coin}`);

  openViaDeeplink() {
    return openDeeplink(baseLink);
  }
  waitForAccountsPageToLoad() {
    return waitForElementByID("accounts-list-title");
  }
}
