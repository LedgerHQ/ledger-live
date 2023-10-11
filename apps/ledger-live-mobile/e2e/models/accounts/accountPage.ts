import { currencyParam, openDeeplink, waitForElementById } from "../../helpers";

const baseLink = "account";

export default class accountPage {
  async waitForAccountPageToLoad(coin: string) {
    await waitForElementById(`account-assets-${coin}`);
  }

  async openViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? baseLink + currencyParam + currencyLong : baseLink;
    await openDeeplink(link);
  }
}
