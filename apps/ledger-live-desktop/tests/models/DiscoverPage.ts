import { Page, Locator } from "@playwright/test";

export class DiscoverPage {
  readonly page: Page;
  readonly discoverTitle: Locator;
  readonly discoverMenuButton: Locator;
  readonly testAppCatalogItem: Locator;
  readonly disclaimerTitle: Locator;
  readonly disclaimerText: Locator;
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
    this.discoverMenuButton = page.locator("data-test-id=drawer-catalog-button");
    this.discoverTitle = page.locator("data-test-id=discover-title");
    this.testAppCatalogItem = page.locator("#platform-catalog-app-dummy-live-app");
    this.disclaimerTitle = page.locator("data-test-id=live-app-disclaimer-drawer-title");
    this.disclaimerText = page.locator("text=External Application");
  }

  async openTestApp() {
    await this.testAppCatalogItem.click();
    await this.disclaimerTitle.waitFor({ state: "visible" });
  }
}
