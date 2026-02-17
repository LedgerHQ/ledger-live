import { WebviewTag } from "~/renderer/components/Web3AppWebview/types";
import { ElectronApplication, Locator, Page, expect } from "@playwright/test";
import { getLiveAppManifest, startDummyServer, stopDummyServer } from "@ledgerhq/test-utils";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";

export class LiveAppWebview {
  webviewPage?: Page;
  readonly page: Page;
  readonly electronApp: ElectronApplication;
  readonly liveAppTitle: Locator;
  readonly liveAppDevtools: Locator;
  readonly liveAppClose: Locator;
  readonly liveAppLoadingSpinner: Locator;
  readonly webview: Locator;
  readonly selectAssetSearchBar: Locator;
  defaultWebViewTimeout = 60_000;

  constructor(page: Page, electronApp: ElectronApplication) {
    this.page = page;
    this.electronApp = electronApp;
    this.webview = page.locator("webview");
    this.liveAppTitle = page.getByTestId("live-app-title");
    this.liveAppDevtools = page.getByTestId("live-app-devtools");
    this.liveAppClose = page.getByTestId("live-app-close");
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

  async openDevTools() {
    // There is likely some race condition in the page and without hover() you click on the element before all it's event listeners are setup.
    // https://github.com/microsoft/playwright/issues/20253#issuecomment-1398568789
    await this.liveAppDevtools.hover();
    await this.liveAppDevtools.click();
  }

  async closeLiveApp() {
    // There is likely some race condition in the page and without hover() you click on the element before all it's event listeners are setup.
    // https://github.com/microsoft/playwright/issues/20253#issuecomment-1398568789
    await this.liveAppClose.hover();
    await this.liveAppClose.click();
  }

  async checkDevToolsOpened() {
    const all = this.electronApp.windows();
    let devtools: Page;
    if (all.length > 2) {
      devtools = all[2];
    } else {
      devtools = await this.electronApp.waitForEvent("window", {
        timeout: this.defaultWebViewTimeout,
      });
    }

    await devtools.waitForLoadState("domcontentloaded", {
      timeout: this.defaultWebViewTimeout,
    });
    devtools.setDefaultTimeout(this.defaultWebViewTimeout);

    const newAll = this.electronApp.windows();
    expect(newAll.length).toBe(3);
    expect(devtools.title()).resolves.toBe("DevTools");
  }

  async checkDevToolsClosed() {
    const all = this.electronApp.windows();
    // Some windows may already be closed by the time we query titles - handle gracefully
    const titles = await Promise.all(all.map(page => page.title().catch(() => "")));
    const devToolsIndex = titles.findIndex(title => title === "DevTools");
    const devtools = devToolsIndex !== -1 ? all[devToolsIndex] : undefined;
    await devtools?.waitForEvent("close", { timeout: this.defaultWebViewTimeout });

    const newAll = this.electronApp.windows();
    expect(newAll.length).toBe(1);
    const newTitles = await Promise.all(newAll.map(w => w.title().catch(() => "")));
    expect(newTitles).not.toContain("DevTools");
  }

  async getLiveAppDappURL() {
    try {
      const src = await this.webview.getAttribute("src");
      const url = new URL(src ?? "");
      const { dappUrl }: { dappUrl: string | null } = JSON.parse(
        url.searchParams.get("params") ?? "",
      );
      return dappUrl;
    } catch {
      return null;
    }
  }

  async getAccountsList() {
    await this.clickByTestId("get-all-accounts-button");
  }

  async requestAsset() {
    await this.clickByTestId("request-single-account-button");
  }

  async verifyAddress() {
    await this.clickByTestId("verify-address-button");
  }

  async listCurrencies() {
    await this.clickByTestId("list-currencies-button");
  }

  async signBitcoinTransaction() {
    await this.clickByTestId("sign-bitcoin-transaction-button");
  }

  async signEthereumTransaction() {
    await this.clickByTestId("sign-ethereum-transaction-button");
  }

  async setCurrencyIds(currencies: string[]) {
    const webview = await this.getWebView();

    // Wait for the input to be ready
    const input = webview.getByTestId("currency-ids-input");
    await input.waitFor({ state: "visible", timeout: 10000 });

    // Set currency IDs using click + keyboard (more reliable than fill())
    await input.click();
    await webview.keyboard.type(currencies.join(","));
  }

  async setAccountId(accountId: string) {
    const webview = await this.getWebView();
    return webview.getByTestId("account-id-input").fill(accountId);
  }

  async setRecipient(recipient: string) {
    const webview = await this.getWebView();
    return webview.getByTestId("recipient-input").fill(recipient);
  }

  async setAmount(amount: string) {
    const webview = await this.getWebView();
    return webview.getByTestId("amount-input").fill(amount);
  }

  async setData(data: string) {
    const webview = await this.getWebView();
    return webview.getByTestId("data-input").fill(data);
  }

  async setDeeplinkUrl(url: string) {
    const webview = await this.getWebView();
    return webview.getByTestId("deeplink-url-input").fill(url);
  }

  async accountRequest() {
    return this.clickByTestId("account-request");
  }

  async accountReceive() {
    return this.clickByTestId("account-receive");
  }

  async accountList() {
    return this.clickByTestId("account-list");
  }

  async bitcoinGetXPub() {
    return this.clickByTestId("bitcoin-getXPub");
  }

  async currencyList() {
    return this.clickByTestId("currency-list");
  }

  async storage() {
    return this.clickByTestId("storage");
  }

  async transactionSign() {
    return this.clickByTestId("transaction-sign");
  }

  async transactionSignSolana() {
    return this.clickByTestId("transaction-sign-solana");
  }

  async transactionSignRawSolana() {
    return this.clickByTestId("transaction-sign-raw-solana");
  }

  async transactionSignRaw() {
    return this.clickByTestId("transaction-sign-raw");
  }

  async transactionSignAndBroadcast() {
    return this.clickByTestId("transaction-signAndBroadcast");
  }

  async walletCapabilities() {
    return this.clickByTestId("wallet-capabilities");
  }

  async walletUserId() {
    return this.clickByTestId("wallet-userId");
  }

  async walletInfo() {
    return this.clickByTestId("wallet-info");
  }

  async customDeeplinkOpen(url: string) {
    await this.setDeeplinkUrl(url);
    return this.clickByTestId("deeplink-open");
  }

  async clearStates() {
    return this.clickByTestId("clear-states");
  }

  async getResOutput() {
    const webview = await this.getWebView();
    const res = await webview.getByTestId("res-output").textContent();
    if (!res) {
      throw new Error("Response output is not present.");
    }
    return JSON.parse(res);
  }

  async getWebView(): Promise<Page> {
    if (this.webviewPage && !this.webviewPage.isClosed()) {
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

  async waitForText(text: string) {
    const webviewPage = await this.getWebView();
    return expect(webviewPage.getByText(text).first()).toBeVisible();
  }

  send(request: Record<string, unknown>) {
    const sendFunction = `
      (function() {
        return window.ledger.e2e.walletApi.send('${JSON.stringify(request)}');
      })()
    `;

    return this.page.evaluate(functionToExecute => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const webview = document.querySelector("webview") as WebviewTag;
      return webview.executeJavaScript(functionToExecute);
    }, sendFunction);
  }

  async clickByTestId(testId: string) {
    const page = await this.getWebView();
    const locator = page.getByTestId(testId);
    // There is likely some race condition in the page and without hover() you click on the element before all it's event listeners are setup.
    // https://github.com/microsoft/playwright/issues/20253#issuecomment-1398568789
    await locator.hover();
    return locator.click();
  }
}
