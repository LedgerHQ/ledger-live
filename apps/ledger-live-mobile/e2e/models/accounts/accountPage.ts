import { currencyParam, openDeeplink, waitForElementToExistWithUniqueId } from "../../helpers";

const hostname = "account";

export default class accountPage {
  waitForAssetPageToLoad = (coin: string) =>
    waitForElementToExistWithUniqueId(`account-assets-${coin}`);

  async openViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? hostname + currencyParam + currencyLong : hostname;
    await openDeeplink(link);
  }
}
