import { Page, Locator, expect } from "@playwright/test";

export class DiscoverPage {
  readonly page: Page;
  readonly discoverMenuButton: Locator;
  readonly app: Function;
  readonly disclaimerText: Locator;
  readonly getAllAccountsButton: Locator;
  readonly requestAccountButton: Locator;
  readonly selectAccountTitle: Locator;
  readonly selectCurrencyDropdown: Locator;
  readonly selectAccountDropdown: Locator;
  readonly currencySelect: Function;
  readonly accountSelect: Function;
  readonly disclaimerCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.discoverMenuButton = page.locator("data-test-id=drawer-catalog-button");
    // NOTE: this.app expects selectors -> apps/ledger-live-desktop/src/renderer/screens/platform/Catalog.js
    this.app = (name: string) : Locator => page.locator(`#platform-catalog-app-${name}`);
    this.disclaimerText = page.locator("text=External Application");
    this.getAllAccountsButton = page.locator("data-test-id=get-all-accounts-button"); // TODO: make this into its own model
    this.requestAccountButton = page.locator("data-test-id=request-single-account-button");
    this.selectAccountTitle = page.locator("text=Choose a crypto asset)");
    this.selectCurrencyDropdown = page.locator(".select__dropdown-indicator").first();
    this.selectAccountDropdown = page.locator(".select__dropdown-indicator").last();
    this.currencySelect = (currency: string) : Locator => page.locator(".select-options-list").locator(`text=${currency}`);
    this.accountSelect = (account: string) : Locator => page.locator(".select__menu-list").locator(`text=${account}`);
    this.disclaimerCheckbox = page.locator("data-test-id=dismiss-disclaimer");
  }

  async launchApp(name: String = "dummy-live-app") {
    await this.app(name).click();
  }

  async getAccountsList() {
    await this.clickWebviewElement("[data-test-id=get-all-accounts-button]");
  }

  async requestAccount() {
    await this.clickWebviewElement("[data-test-id=request-single-account-button]");
  }

  async selectAccount(currency: string, account: string) {
    await this.selectCurrencyDropdown.click({ force: true });
    await this.currencySelect(currency).click({ force: true });
    await this.selectAccountDropdown.click({ force: true });
    await this.accountSelect(account).click({ force: true });
  }

  async verifyAddress() {
    await this.clickWebviewElement("[data-test-id=verify-address-button]");
  }

  async clickWebviewElement(elementName: string) {
    await this.page.evaluate(elementName => {
      const webview = document.querySelector("webview");

      (webview as any).executeJavaScript(`(
        function () {
          const element = document.querySelector('${elementName}');
          element.click();
        }
      )();`);
    }, elementName);
  }

  async fillWebviewElement(elementName: string, value: string) {
    await this.page.evaluate(args => {
      const [elementName, value] = args
      const webview = document.querySelector("webview");

      (webview as any).executeJavaScript(`(
        function () {
          const element = document.querySelector('${elementName}');
          element.value = '${value}';
        }
      )();`);
    }, [elementName, value]);
  }
}
