import { currencyParam, openDeeplink, waitForElementById } from "../../helpers";

const baseLink = "account";

export default class accountPage {
  async openViaDeeplink(currencyName?: string) {
    const link = currencyName ? baseLink + currencyParam + currencyName : baseLink;
    await openDeeplink(link);
  }

  async waitForAccountsPageToLoad() {
    await waitForElementById("accounts-list-title");
  }

  async waitForAccountAssetsToLoad(currencyName: string) {
    await waitForElementById(`account-assets-${currencyName}`);
    await waitForElementById(`accounts-title-${currencyName}`);
  }
}
