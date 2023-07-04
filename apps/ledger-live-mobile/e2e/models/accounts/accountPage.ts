import { currencyParam, openDeeplink, waitForElementByID } from "../../helpers";

const baseLink = "accounts";

export default class accountPage {
  waitForAccountPageToLoad(coin: string) {
    return waitForElementByID(`accounts-title-${coin}`);
  }

  openViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? baseLink + currencyParam + currencyLong : baseLink;
    return openDeeplink(link);
  }
}
