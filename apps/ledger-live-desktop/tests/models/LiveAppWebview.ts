import { Page, Locator } from "@playwright/test";
import { WebviewTag } from "../../src/renderer/components/Web3AppWebview/types";
import { waitFor } from "../utils/waitFor";
import { getLiveAppManifest, startDummyServer, stopDummyServer } from "@ledgerhq/test-utils";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";

export class LiveAppWebview {
  readonly page: Page;
  readonly liveAppTitle: Locator;
  readonly liveAppLoadingSpinner: Locator;
  readonly getAllAccountsButton: Locator;
  readonly requestAccountButton: Locator;
  readonly selectAssetTitle: Locator;
  readonly selectAssetSearchBar: Locator;
  readonly selectAccountTitle: Locator;
  readonly selectBtcAsset: Locator;
  readonly selectBtcAccount: Locator;
  readonly disclaimerCheckbox: Locator;
  readonly signNetworkWarning: Locator;
  readonly signContinueButton: Locator;
  readonly confirmText: Locator;
  readonly webview: Locator;

  constructor(page: Page) {
    this.page = page;
    this.webview = page.locator("webview");
    this.liveAppTitle = page.locator("data-test-id=live-app-title");
    this.liveAppLoadingSpinner = page.locator("data-test-id=live-app-loading-spinner");
    this.getAllAccountsButton = page.locator("data-test-id=get-all-accounts-button"); // TODO: make this into its own model
    this.requestAccountButton = page.locator("data-test-id=request-single-account-button");
    this.selectAssetTitle = page.locator("data-test-id=select-asset-drawer-title");
    this.selectAssetSearchBar = page.locator("data-test-id=select-asset-drawer-search-input");
    this.selectAccountTitle = page.locator("data-test-id=select-account-drawer-title");
    this.selectBtcAsset = page.locator("text=Bitcoin").first();
    this.selectBtcAccount = page.locator("text=Bitcoin 1 (legacy)").first();
    this.disclaimerCheckbox = page.locator("data-test-id=dismiss-disclaimer");
    this.signNetworkWarning = page.locator("text=Network fees are above 10% of the amount").first();
    this.signContinueButton = page.locator("text=Continue");
    this.confirmText = page.locator(
      "text=Please confirm the operation on your device to finalize it",
    );
  }

  static async startLiveApp(
    liveAppDirectory: string,
    liveAppManifest: Partial<AppManifest> & Pick<AppManifest, "id">,
  ) {
    try {
      const port = await startDummyServer(`${liveAppDirectory}`);

      const url = `http://localhost:${port}`;
      const response = await fetch(url);
      if (response.ok) {
        // eslint-disable-next-line no-console
        console.info(`========> Live app successfully running on port ${port}! <=========`);

        const localManifests = JSON.stringify(getLiveAppManifest({ ...liveAppManifest, url: url }));
        process.env.MOCK_REMOTE_LIVE_MANIFEST = localManifests;
        return true;
      } else {
        throw new Error("Ping response != 200, got: " + response.status);
      }
    } catch (error) {
      console.warn(`========> Live app not running! <=========`);
      console.error(error);
      return false;
    }
  }

  static async stopLiveApp() {
    await stopDummyServer();
    delete process.env.MOCK_REMOTE_LIVE_MANIFEST;
  }

  async getLiveAppTitle() {
    return await this.liveAppTitle.textContent();
  }

  async getLiveAppDappURL() {
    try {
      const src = await this.webview.getAttribute("src");
      const url = new URL(src ?? "");
      const { dappUrl }: { dappUrl: string | null } = JSON.parse(
        url.searchParams.get("params") ?? "",
      );
      return dappUrl;
    } catch (e) {
      return null;
    }
  }

  async getAccountsList() {
    await this.clickWebviewElement("[data-test-id=get-all-accounts-button]");
  }

  async requestAsset() {
    await this.clickWebviewElement("[data-test-id=request-single-account-button]");
    await this.selectAssetTitle.isVisible();
    await this.selectAssetSearchBar.isEnabled();
  }

  async selectAsset() {
    await this.selectBtcAsset.click();
  }

  async selectAccount() {
    await this.selectAccountTitle.isVisible();
    // TODO: make this dynamic with passed in variable
    await this.selectBtcAccount.click();
  }

  async verifyAddress() {
    await this.clickWebviewElement("[data-test-id=verify-address-button]");
  }

  async listCurrencies() {
    await this.clickWebviewElement("[data-test-id=list-currencies-button]");
  }

  async signTransaction() {
    await this.clickWebviewElement("[data-test-id=sign-transaction-button]");
    await this.signNetworkWarning.waitFor({ state: "visible" });
  }

  async continueToSignTransaction() {
    await this.signContinueButton.click({ force: true });
  }

  async waitForConfirmationScreenToBeDisplayed() {
    await this.confirmText.waitFor({ state: "visible" });
  }

  async clickWebviewElement(elementName: string) {
    await this.page.evaluate(elementName => {
      const webview = document.querySelector("webview");
      (webview as WebviewTag).executeJavaScript(
        `(function() {
        const element = document.querySelector('${elementName}');
        element.click();
      })();
    `,
      );
    }, elementName);
  }

  async waitForCorrectTextInWebview(textToCheck: string) {
    return waitFor(() => this.textIsPresent(textToCheck));
  }

  async textIsPresent(textToCheck: string) {
    const result: boolean = await this.page.evaluate(textToCheck => {
      const webview = document.querySelector("webview");
      return (webview as WebviewTag)
        .executeJavaScript(
          `(function() {
        return document.querySelector('*').innerHTML;
      })();
    `,
        )
        .then((text: string) => {
          return text.includes(textToCheck);
        });
    }, textToCheck);

    return result;
  }

  send(request: Record<string, unknown>) {
    const sendFunction = `
      (function() {
        return window.ledger.e2e.walletApi.send('${JSON.stringify(request)}');
      })()
    `;

    return this.page.evaluate(functionToExecute => {
      const webview = document.querySelector("webview") as WebviewTag;
      return webview.executeJavaScript(functionToExecute);
    }, sendFunction);
  }
}
