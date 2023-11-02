import { Page, Locator } from "@playwright/test";
import { WebviewTag } from "../../src/renderer/components/Web3AppWebview/types";
import { waitFor } from "../utils/waitFor";
import { getLiveAppManifest, startDummyServer, stopDummyServer } from "@ledgerhq/test-utils";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";

export class LiveAppWebview {
  readonly page: Page;
  readonly liveAppTitle: Locator;
  readonly liveAppLoadingSpinner: Locator;
  readonly webview: Locator;
  readonly selectAssetTitle: Locator;
  readonly selectAssetSearchBar: Locator;
  readonly selectAccountTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.webview = page.locator("webview");
    this.liveAppTitle = page.locator("data-test-id=live-app-title");
    this.liveAppLoadingSpinner = page.locator("data-test-id=live-app-loading-spinner");
    this.selectAssetTitle = page.locator("data-test-id=select-asset-drawer-title");
    this.selectAssetSearchBar = page.locator("data-test-id=select-asset-drawer-search-input");
    this.selectAccountTitle = page.locator("data-test-id=select-account-drawer-title");
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
  }

  async verifyAddress() {
    await this.clickWebviewElement("[data-test-id=verify-address-button]");
  }

  async listCurrencies() {
    await this.clickWebviewElement("[data-test-id=list-currencies-button]");
  }

  async signBitcoinTransaction() {
    await this.clickWebviewElement("[data-test-id=sign-bitcoin-transaction-button]");
  }

  async signEthereumTransaction() {
    await this.clickWebviewElement("[data-test-id=sign-ethereum-transaction-button]");
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

  async waitForLoaded() {
    return this.page.waitForLoadState("domcontentloaded");
  }

  async textIsPresent(textToCheck: string) {
    const result: boolean = await this.page.evaluate(textToCheck => {
      const webview = document.querySelector("webview");
      return (webview as WebviewTag)
        .executeJavaScript("document.body.innerHTML")
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
