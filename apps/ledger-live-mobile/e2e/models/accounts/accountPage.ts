import { currencyParam, openDeeplink, waitForElementById } from "../../helpers";

const baseLink = "account";

export default class accountPage {
  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }
  async openAssetScreenViaDeeplink(currencyName: string) {
    const link = baseLink + currencyParam + currencyName;
    await openDeeplink(link);
  }

  waitForAccountAssetsToLoad(currencyName: string) {
    return waitForElementById(`account-assets-${currencyName}`);
  }
}
