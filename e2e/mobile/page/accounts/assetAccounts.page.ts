import { expect } from "detox";
import { currencyParam, openDeeplink } from "../../helpers/commonHelpers";

export default class AssetAccountsPage {
  private baseLink = "account";

  // Async getters
  private async assetBalance() {
    return await getElementById("asset-graph-balance");
  }

  private titleId(assetName: string) {
    return `accounts-title-${assetName}`;
  }

  private accountAssetId(assetName: string) {
    return `account-assets-${assetName}`;
  }

  @Step("Wait for asset page to load")
  async waitForAccountPageToLoad(assetName: string) {
    await waitForElementById(this.titleId(assetName.toLowerCase()));
  }

  @Step("Expect asset balance to be visible")
  async expectAccountsBalanceVisible() {
    const balanceEl = await this.assetBalance();
    await expect(balanceEl).toBeVisible();
  }

  @Step("Expect asset balance text")
  async expectAccountsBalance(expectedBalance: string) {
    const balanceEl = await this.assetBalance();
    await expect(balanceEl).toHaveText(expectedBalance);
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
