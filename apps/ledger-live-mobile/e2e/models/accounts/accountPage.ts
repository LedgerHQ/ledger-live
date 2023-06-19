import { currencyParam, openDeeplink, waitForElementByID } from "../../helpers";

const baseLink = "accounts";

export default class accountPage {
  async waitForAccountPageToLoad(coin: string) {
    await waitForElementByID(`accounts-title-${coin}`);
  }

  async openViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? baseLink + currencyParam + currencyLong : baseLink;
    await openDeeplink(link);
  }
}
