import { currencyParam, openDeeplink, waitForElementByID } from "../../helpers";

const baseLink = "accounts";
let link: string;

export default class accountPage {
  async waitForAccountPageToLoad(coin: string) {
    await waitForElementByID(`accounts-title-${coin}`);
  }

  async openViaDeeplink(currencyLong?: string) {
    link = currencyLong ? baseLink + currencyParam + currencyLong : baseLink;
    await openDeeplink(link);
  }
}
