import { Step } from "jest-allure2-reporter/api";
import { currencyParam, openDeeplink } from "@e2e/helpers/commonHelpers";
import { byId, NativeHandle } from "@e2e/helpers/elements/native";

type QuickAction = "send" | "receive" | "buy" | "sell" | "swap";

export default class AssetAccountsPage {
  private readonly baseLink = "account";
  private readonly title = (assetName: string) => byId(`accounts-title-${assetName}`);
  private readonly accountAssets = (assetName: string) => byId(`account-assets-${assetName}`);
  private readonly assetDetailScrollView = (currencyId: string) =>
    byId(`asset-detail-scroll-view-${currencyId}`);
  private readonly assetQuickActionButton = (action: QuickAction) =>
    byId(`asset-quick-action-button-${action}`);
  private readonly assetDetailActionButtons: Partial<Record<QuickAction, NativeHandle>> = {
    buy: byId("asset-detail-buy-button"),
    swap: byId("asset-detail-swap-button"),
    receive: byId("asset-detail-footer-receive-button"),
  };

  @Step("Wait for asset page to load {{{0}}}")
  async waitForAccountPageToLoad(
    assetName: string,
    currencyId?: string,
    inCryptoAddressesList = false,
  ) {
    if (inCryptoAddressesList) {
      return;
    }
    await this.assetDetailScrollView(currencyId ?? assetName.toLowerCase()).waitVisible();
  }

  @Step("Wait for individual asset rows to load {{{0}}}")
  async waitForAccountAssetsToLoad(assetName: string) {
    await this.title(assetName).waitVisible();
    await this.accountAssets(assetName).waitVisible();
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
  async tapOnAssetQuickActionButton(action: QuickAction) {
    await (this.assetDetailActionButtons[action] ?? this.assetQuickActionButton(action)).tap();
  }

  @Step("Open asset page via deeplink {{{0}}}")
  async openAssetPageViaDeeplink(currencyId: string) {
    await openDeeplink(`asset/${currencyId}`);
  }

  @Step("Expect asset page to be visible {{{0}}}")
  async expectAssetPage(currencyId?: string) {
    const currency = currencyId?.toLowerCase() || "bitcoin";
    await this.assetDetailScrollView(currency).waitVisible();
  }
}
