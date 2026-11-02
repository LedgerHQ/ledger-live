import { Step } from "jest-allure2-reporter/api";
import { currencyParam, openDeeplink } from "@e2e/helpers/commonHelpers";

export default class AssetAccountsPage {
  baseLink = "account";
  titleId = (assetName: string) => `accounts-title-${assetName}`;
  accountAssetId = (assetName: string) => `account-assets-${assetName}`;

  @Step("Wait for asset page to load {{{0}}}")
  async waitForAccountPageToLoad(
    assetName: string,
    currencyId?: string,
    inCryptoAddressesList = false,
  ) {
    if (inCryptoAddressesList) {
      return;
    }
    await waitForElementById(`asset-detail-scroll-view-${currencyId ?? assetName.toLowerCase()}`);
  }

  @Step("Expect asset balance to be visible")
  async expectAccountsBalanceVisible() {
    // Asset Detail confirms the screen in waitForAccountPageToLoad.
  }

  @Step("Wait for individual asset rows to load {{{0}}}")
  async waitForAccountAssetsToLoad(assetName: string) {
    await waitForElementById(this.titleId(assetName));
    await waitForElementById(this.accountAssetId(assetName));
  }

  @Step("Open asset list via deeplink {{{0}}}")
  async openViaDeeplink(currencyLong?: string) {
    if (!currencyLong) {
      await openDeeplink("crypto-addresses");
      return;
    }
    await openDeeplink(this.baseLink + currencyParam + currencyLong);
  }

  @Step("Tap on asset quick action button {{{0}}}")
  async tapOnAssetQuickActionButton(action: "send" | "receive" | "buy" | "sell" | "swap") {
    const q2TestIds: Partial<Record<typeof action, string>> = {
      buy: "asset-detail-buy-button",
      swap: "asset-detail-swap-button",
      receive: "asset-detail-footer-receive-button",
    };
    const testId = q2TestIds[action] ?? `asset-quick-action-button-${action}`;
    await waitForElementById(testId);
    await tapById(testId);
  }

  @Step("Open asset page via deeplink {{{0}}}")
  async openAssetPageViaDeeplink(currencyId: string) {
    await openDeeplink(`asset/${currencyId}`);
  }

  @Step("Expect asset page to be visible {{{0}}}")
  async expectAssetPage(currencyId?: string) {
    const currency = currencyId?.toLowerCase() || "bitcoin";
    await waitForElementById(`asset-detail-scroll-view-${currency}`);
  }
}
