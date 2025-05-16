import { currencyParam, openDeeplink } from "../../helpers/commonHelpers";

export default class AssetAccountsPage {
  baseLink = "account";

  assetBalance = () => getElementById("asset-graph-balance");
  titleId = (assetName: string) => `accounts-title-${assetName}`;
  accountAssetId = (assetName: string) => `account-assets-${assetName}`;

  @Step("Wait for asset page to load")
  async waitForAccountPageToLoad(assetName: string) {
    await waitForElementById(this.titleId(assetName.toLowerCase()));
  }

  @Step("Expect asset balance to be visible")
  async expectAccountsBalanceVisible() {
    const balanceEl = this.assetBalance();
    await detoxExpect(balanceEl).toBeVisible();
  }

  @Step("Wait for individual asset rows to load")
  async waitForAccountAssetsToLoad(assetName: string) {
    await waitForElementById(this.titleId(assetName));
    await waitForElementById(this.accountAssetId(assetName));
  }

  @Step("Open asset list via deeplink")
  async openViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? this.baseLink + currencyParam + currencyLong : this.baseLink;
    await openDeeplink(link);
  }
}
