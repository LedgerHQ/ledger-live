import { currencyParam, openDeeplink, waitForElementById, getElementById } from "../../helpers";

const baseLink = "account";

export default class accountPage {
  accountSettingsButton = () => getElementById("accounts-settings");

  async waitForAccountPageToLoad(coin: string) {
    await waitForElementById(`accounts-title-${coin}`);
  }

  async waitForAccountsPageToLoad() {
    await waitForElementById("accounts-list-title");
  }

  async waitForAccountAssetsToLoad(currencyName: string) {
    await waitForElementById(`account-assets-${currencyName}`);
    await waitForElementById(`accounts-title-${currencyName}`);
  }

  async openViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? baseLink + currencyParam + currencyLong : baseLink;
    await openDeeplink(link);
  }

  async openAccountSettings() {
    await this.accountSettingsButton().tap();
  }
}
