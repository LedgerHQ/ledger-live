import { currencyParam, openDeeplink, waitForElementById } from "../../helpers";

const baseLink = "account";

export default class accountAssetPage {
  async openAssetScreenViaDeeplink(currencyName: string) {
    const link = baseLink + currencyParam + currencyName;
    await openDeeplink(link);
  }

  waitForAccountAssetsToLoad(currencyName: string) {
    return waitForElementById(`account-assets-${currencyName}`, 240000);
  }
}
