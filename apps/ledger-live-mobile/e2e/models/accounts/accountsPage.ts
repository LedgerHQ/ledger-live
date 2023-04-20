import {
  currencyParam,
  getElementById,
  openDeeplink,
  tapByElement,
  waitForElementByID,
} from "../../helpers";

let baseLink: string = "accounts";

export default class accountsPage {
  accountTitle = (coin: string) => getElementById(`accounts-title-${coin}`);

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }
  async waitForAccountsPageToLoad() {
    await waitForElementByID("accounts-list-title");
  }
}
