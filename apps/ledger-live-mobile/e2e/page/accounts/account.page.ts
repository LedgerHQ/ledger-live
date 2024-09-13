import { expect } from "detox";
import {
  currencyParam,
  openDeeplink,
  waitForElementById,
  getElementById,
  tapByElement,
} from "../../helpers";

const baseLink = "account";

export default class AccountPage {
  accountSettingsButton = () => getElementById("accounts-settings");
  assetBalance = () => getElementById("asset-graph-balance");
  accountTitleId = (assetName: string) => `accounts-title-${assetName}`;
  accountAssetId = (assetName: string) => `account-assets-${assetName}`;

  async waitForAccountPageToLoad(assetName: string) {
    await waitForElementById(this.accountTitleId(assetName));
  }

  async expectAccountBalanceVisible() {
    await expect(this.assetBalance()).toBeVisible();
  }

  async expectAccountBalance(expectedBalance: string) {
    await expect(this.assetBalance()).toHaveText(expectedBalance);
  }

  async waitForAccountAssetsToLoad(assetName: string) {
    await waitForElementById(this.accountTitleId(assetName));
    await waitForElementById(this.accountAssetId(assetName));
  }

  async openViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? baseLink + currencyParam + currencyLong : baseLink;
    await openDeeplink(link);
  }

  async openAccountSettings() {
    await tapByElement(this.accountSettingsButton());
  }
}
