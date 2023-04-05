import {
  currencyParam,
  getElementById,
  openDeeplink,
  tapByElement,
  waitForElementByID,
} from "../../helpers";

let baseLink: string = "accounts";

export default class accountPage {
  async waitForAccountPageToLoad(coin: string) {
    await waitForElementByID(`accounts-title-${coin}`);
  }

  async openViaDeeplink(currencyLong?: string) {
    let link = currencyLong
      ? baseLink + currencyParam + currencyLong
      : baseLink;
    await openDeeplink(link);
  }
}
