import { expect } from "detox";
import { currencyParam, openDeeplink } from "../../helpers/commonHelpers";

export default class AssetAccountsPage {
  baseLink = "account";
  assetBalanceId = "asset-graph-balance";
  assetBalance = () => getElementById(this.assetBalanceId);
  titleId = (assetName: string) => `accounts-title-${assetName}`;
  accountAssetId = (assetName: string) => `account-assets-${assetName}`;

  @Step("Wait for asset page to load")
  async waitForAccountPageToLoad(assetName: string) {
    await waitForElementById(this.titleId(assetName.toLowerCase()));
  }

  async expectAccountsBalance(expectedBalance: string) {
    await waitForElementById(this.assetBalanceId);
    await expect(this.assetBalance()).toHaveText(expectedBalance);
  }

  async waitForAccountAssetsToLoad(assetName: string) {
    await waitForElementById(this.titleId(assetName));
    await waitForElementById(this.accountAssetId(assetName));
  }

  async openViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? this.baseLink + currencyParam + currencyLong : this.baseLink;
    await openDeeplink(link);
  }

  async openAssetPageViaDeeplink(currencyId: string) {
    await openDeeplink(`asset/${currencyId}`);
  }

  async expectAssetPage(currencyId?: string) {
    const currency = currencyId?.toLowerCase() || "bitcoin";
    await waitForElementById(this.accountAssetId(currency));
  }
}
