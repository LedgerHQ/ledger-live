import { Page, Locator } from "@playwright/test";

export class Drawer {
  readonly page: Page;
  readonly content: Locator;
  readonly drawerOverlay: Locator;
  readonly continueButton: Locator;
  readonly closeButton: Locator;
  readonly currencyButton: (currency: string) => Locator;
  readonly accountButton: (accountName: string, index: number) => Locator;
  readonly selectAssetTitle: Locator;
  readonly selectAssetSearchBar: Locator;
  readonly selectAccountTitle: Locator;
  readonly disclaimerCheckbox: Locator;
  readonly swapAmountFrom: Locator;
  readonly swapAmountTo: Locator;
  readonly swapAccountFrom: Locator;
  readonly swapAccountTo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.content = page.locator("data-test-id=drawer-content");
    this.drawerOverlay = page.locator("[data-test-id='drawer-overlay'][style='opacity: 1;']");
    this.continueButton = page.locator("data-test-id=drawer-continue-button");
    this.closeButton = page.locator("data-test-id=drawer-close-button");
    this.currencyButton = currency =>
      page.locator(`data-test-id=currency-row-${currency.toLowerCase()}`);
    this.accountButton = (accountName, index) =>
      page.locator(`data-test-id=account-row-${accountName.toLowerCase()}-${index}`).first();
    this.selectAssetTitle = page.locator("data-test-id=select-asset-drawer-title");
    this.selectAssetSearchBar = page.locator("data-test-id=select-asset-drawer-search-input");
    this.selectAccountTitle = page.locator("data-test-id=select-account-drawer-title");
    this.disclaimerCheckbox = page.locator("data-test-id=dismiss-disclaimer");
    this.swapAmountFrom = page.locator("data-test-id=swap-amount-from").first();
    this.swapAmountTo = page.locator("data-test-id=swap-amount-to").first();
    this.swapAccountFrom = page.locator("data-test-id=swap-account-from").first();
    this.swapAccountTo = page.locator("data-test-id=swap-account-to").first();
  }

  async continue() {
    await this.continueButton.click();
  }

  async waitForDrawerToBeVisible() {
    await this.content.waitFor({ state: "visible" });
    await this.closeButton.waitFor({ state: "visible" });
    await this.drawerOverlay.waitFor({ state: "attached" });
  }

  async waitForDrawerToDisappear() {
    await this.continueButton.waitFor({ state: "detached" });
    await this.closeButton.waitFor({ state: "detached" });
    await this.drawerOverlay.waitFor({ state: "detached" });
  }

  async close() {
    await this.closeButton.click();
  }

  // CURRENCY/ASSET ACTIONS
  async selectCurrency(currency: string) {
    await this.currencyButton(currency).click();
  }

  async selectAccount(accountName: string, index = 0) {
    await this.accountButton(accountName, index).click();
  }

  async verifyAssetIsReady() {
    await this.selectAssetTitle.isVisible();
    await this.selectAssetSearchBar.isEnabled();
  }
}
