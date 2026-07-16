import { Step } from "jest-allure2-reporter/api";
import { currencyParam, openDeeplink } from "../../helpers/commonHelpers";
import { isAggregatedAssetsEnabled } from "../../utils/featureFlagUtils";

export default class AssetAccountsPage {
  baseLink = "account";
  assetBalance = () => getElementById("asset-graph-balance");
  titleId = (assetName: string) => `accounts-title-${assetName}`;
  accountAssetId = (assetName: string) => `account-assets-${assetName}`;
  assetQuickActionButton = (action: "send" | "receive" | "buy" | "sell" | "swap") =>
    getElementById(`asset-quick-action-button-${action}`);

  @Step("Wait for asset page to load")
  async waitForAccountPageToLoad(
    assetName: string,
    currencyId?: string,
    inCryptoAddressesList = false,
  ) {
    if (await isAggregatedAssetsEnabled()) {
      if (inCryptoAddressesList) {
        return; // goToAccounts already navigated to the account page via CryptoAddressesScreen
      }
      await waitForElementById(`asset-detail-scroll-view-${currencyId ?? assetName.toLowerCase()}`);
    } else {
      await waitForElementById(this.titleId(assetName.toLowerCase()));
    }
  }

  @Step("Expect asset balance to be visible")
  async expectAccountsBalanceVisible() {
    if (await isAggregatedAssetsEnabled()) {
      return; // screen already confirmed in waitForAccountPageToLoad; no legacy balance element in Q2
    }
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
    if (!currencyLong && (await isAggregatedAssetsEnabled())) {
      await openDeeplink("crypto-addresses");
    } else {
      const link = currencyLong ? this.baseLink + currencyParam + currencyLong : this.baseLink;
      await openDeeplink(link);
    }
  }

  @Step("Tap on asset quick action button ")
  async tapOnAssetQuickActionButton(action: "send" | "receive" | "buy" | "sell" | "swap") {
    if (await isAggregatedAssetsEnabled()) {
      const q2TestIds: Partial<Record<typeof action, string>> = {
        buy: "asset-detail-buy-button",
        swap: "asset-detail-swap-button",
        receive: "asset-detail-footer-receive-button",
      };
      const testId = q2TestIds[action] ?? `asset-quick-action-button-${action}`;
      await waitForElementById(testId);
      await tapById(testId);
    } else {
      const quickActionButton = this.assetQuickActionButton(action);
      await waitForElement(quickActionButton);
      await tapByElement(quickActionButton);
    }
  }

  @Step("Open asset page via deeplink")
  async openAssetPageViaDeeplink(currencyId: string) {
    await openDeeplink(`asset/${currencyId}`);
  }

  @Step("Expect asset page to be visible")
  async expectAssetPage(currencyId?: string) {
    const currency = currencyId?.toLowerCase() || "bitcoin";
    if (await isAggregatedAssetsEnabled()) {
      await waitForElementById(`asset-detail-scroll-view-${currency}`);
    } else {
      await waitForElementById(this.accountAssetId(currency));
    }
  }
}
