import { currencyParam, openDeeplink, waitForElementById, getElementById } from "../../helpers";

const baseLink = "account";

export default class accountPage {
  accountSettingsButton = () => getElementById("accounts-settings");

  async waitForAccountPageToLoad(coin: string) {
    await waitForElementById(`accounts-title-${coin}`);
  }

  async openViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? baseLink + currencyParam + currencyLong : baseLink;
    await openDeeplink(link);
  }

  async openAccountSettings() {
    await this.accountSettingsButton().tap();
  }
}
