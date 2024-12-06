import { expect } from "detox";
import {
  currencyParam,
  openDeeplink,
  waitForElementById,
  getElementById,
  scrollToId,
  tapById,
} from "../../helpers";

const baseLink = "account";

export default class AssetAccountsPage {
  assetBalance = () => getElementById("asset-graph-balance");
  titleId = (assetName: string) => `accounts-title-${assetName}`;
  accountAssetId = (assetName: string) => `account-assets-${assetName}`;
  accountRowId = (accountId: string) => `account-row-${accountId}`;
  accountNameRegExp = /account-row-name-.*/;

  @Step("Wait for asset page to load")
  async waitForAccountPageToLoad(assetName: string) {
    await waitForElementById(this.titleId(assetName.toLowerCase()));
  }

  @Step("Expect asset balance to be visible")
  async expectAccountsBalanceVisible() {
    await expect(this.assetBalance()).toBeVisible();
  }

  async expectAccountsBalance(expectedBalance: string) {
    await expect(this.assetBalance()).toHaveText(expectedBalance);
  }

  async waitForAccountAssetsToLoad(assetName: string) {
    await waitForElementById(this.titleId(assetName));
    await waitForElementById(this.accountAssetId(assetName));
  }

  async openViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? baseLink + currencyParam + currencyLong : baseLink;
    await openDeeplink(link);
  }

  @Step("Go to the account")
  async goToAccount(accountId: string) {
    await scrollToId(this.accountNameRegExp);
    await tapById(this.accountRowId(accountId));
  }
}
