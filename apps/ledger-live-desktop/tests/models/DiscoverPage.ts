import { Page, Locator } from "@playwright/test";

export class DiscoverPage {
  readonly page: Page;
  readonly discoverMenuButton: Locator;
  readonly testAppCatalogItem: Locator;
  readonly disclaimerText: Locator;
  readonly getAllAccountsButton: Locator;
  readonly requestAccountButton: Locator;
  readonly selectAccountTitle: Locator;
  readonly selectAccountDropdown: Locator;
  readonly selectBtcAccount: Locator;
  readonly disclaimerCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.discoverMenuButton = page.locator("data-test-id=drawer-catalog-button");
    this.testAppCatalogItem = page.locator("#platform-catalog-app-dummy-live-app");
    this.disclaimerText = page.locator("text=External Application");
    this.getAllAccountsButton = page.locator("data-test-id=get-all-accounts-button"); // TODO: make this into its own model
    this.requestAccountButton = page.locator("data-test-id=request-single-account-button");
    this.selectAccountTitle = page.locator("text=Choose a crypto asset)");
    this.selectAccountDropdown = page.locator(".select__dropdown-indicator").last();
    this.selectBtcAccount = page.locator("text=Bitcoin (BTC)");
    this.disclaimerCheckbox = page.locator("data-test-id=dismiss-disclaimer");
  }

  async openTestApp() {
    await this.testAppCatalogItem.click();
  }

  async getAccountsList() {
    await this.clickWebviewElement("[data-test-id=get-all-accounts-button]");
  }

  async requestAccount() {
    await this.clickWebviewElement("[data-test-id=request-single-account-button]");
  }

  async openAccountDropdown() {
    // FIXME - this isn't working without force. 'subtree intercepts pointer events' error
    await this.selectAccountDropdown.click({ force: true });
  }

  async selectAccount() {
    // TODO: make this dynamic with passed in variable
    await this.selectBtcAccount.click({ force: true });
  }

  async verifyAddress() {
    await this.clickWebviewElement("[data-test-id=verify-address-button]]");
  }

  async clickWebviewElement(elementName: string) {
    await this.page.evaluate(elementName => {
      const webview = document.querySelector("webview");
      (webview as any).executeJavaScript(
        `(function() {
        const element = document.querySelector('${elementName}');
        element.click();
      })();
    `,
      );
    }, elementName);

    await this.letLiveAppLoad();
  }

  async letLiveAppLoad() {
    /* 
      Pauses execution for 1 second.
      The main reason is that it is tricky to wait for internal elements in the iframe
      and the without a short pause after each Live App action the screenshots are very 
      flaky. Adding a 1 second wait is not good practice but it will fix flakiness and it
      should only be used in this cicumstance (hence the name 'letLiveAppLoad'). When 
      waiting for elements in LLD we should always do proper waits. 
    */
    return new Promise(function(resolve) {
      setTimeout(resolve, 1000);
    });
  }

  // TODO: mocked device events for test
}
