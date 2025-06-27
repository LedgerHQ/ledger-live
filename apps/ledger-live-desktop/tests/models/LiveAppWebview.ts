import { WebviewTag } from "~/renderer/components/Web3AppWebview/types";
import { ElectronApplication, Locator, Page } from "@playwright/test";
import { getLiveAppManifest, startDummyServer, stopDummyServer } from "@ledgerhq/test-utils";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";

export class LiveAppWebview {
  webviewPage?: Page;
  readonly page: Page;
  readonly electronApp: ElectronApplication;
  readonly liveAppTitle: Locator;
  readonly liveAppLoadingSpinner: Locator;
  readonly webview: Locator;
  readonly selectAssetSearchBar: Locator;
  defaultWebViewTimeout = 60_000;

  constructor(page: Page, electronApp: ElectronApplication) {
    this.page = page;
    this.electronApp = electronApp;
    this.webview = page.locator("webview");
    this.liveAppTitle = page.getByTestId("live-app-title");
    this.liveAppLoadingSpinner = page.getByTestId("live-app-loading-spinner");
    this.selectAssetSearchBar = page.getByTestId("select-asset-drawer-search-input");
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

        process.env.MOCK_REMOTE_LIVE_MANIFEST = JSON.stringify(
          getLiveAppManifest({ ...liveAppManifest, url: url }),
        );
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
    const webviewPage = await this.getWebView();
    await webviewPage.getByTestId("get-all-accounts-button").click();
  }

  async requestAsset() {
    const webviewPage = await this.getWebView();
    await webviewPage.getByTestId("request-single-account-button").click();
  }

  async verifyAddress() {
    const webviewPage = await this.getWebView();
    await webviewPage.getByTestId("verify-address-button").click();
  }

  async listCurrencies() {
    const webviewPage = await this.getWebView();
    await webviewPage.getByTestId("list-currencies-button").click();
  }

  async signBitcoinTransaction() {
    const webviewPage = await this.getWebView();
    await webviewPage.getByTestId("sign-bitcoin-transaction-button").click();
  }

  async signEthereumTransaction() {
    const webviewPage = await this.getWebView();
    await webviewPage.getByTestId("sign-ethereum-transaction-button").click();
  }

  async getWebView(): Promise<Page> {
    if (this.webviewPage) {
      return this.webviewPage;
    }
    if (!this.electronApp) {
      throw new Error("No ElectronApplication instance available");
    }

    const all = this.electronApp.windows();
    let webview: Page;
    if (all.length > 1) {
      webview = all[1];
    } else {
      webview = await this.electronApp.waitForEvent("window", {
        timeout: this.defaultWebViewTimeout,
      });
    }

    await webview.waitForLoadState("domcontentloaded", {
      timeout: this.defaultWebViewTimeout,
    });
    webview.setDefaultTimeout(this.defaultWebViewTimeout);
    this.webviewPage = webview;
    return webview;
  }

  async waitForLoaded() {
    return this.page.waitForLoadState("domcontentloaded");
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
