import { currencyParam, openDeeplink } from "../../helpers/commonHelpers";

export default class AssetAccountsPage {
  baseLink = "account";
  assetBalance = () => getElementById("asset-graph-balance");
  titleId = (assetName: string) => `accounts-title-${assetName}`;
  accountAssetId = (assetName: string) => `account-assets-${assetName}`;
  assetQuickActionButton = (action: "send" | "receive" | "buy" | "sell" | "swap") =>
    getElementById(`asset-quick-action-button-${action}`);

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

  @Step("Tap on asset quick action button ")
  async tapOnAssetQuickActionButton(action: "send" | "receive" | "buy" | "sell" | "swap") {
    await tapByElement(this.assetQuickActionButton(action));
  }

  @Step("Open asset page via deeplink")
  async openAssetPageViaDeeplink(currencyId: string) {
    await openDeeplink(`asset/${currencyId}`);
  }

  @Step("Expect asset page to be visible")
  async expectAssetPage(currencyId?: string) {
    const currency = currencyId?.toLowerCase() || "bitcoin";
    await waitForElementById(this.accountAssetId(currency));
  }
}
