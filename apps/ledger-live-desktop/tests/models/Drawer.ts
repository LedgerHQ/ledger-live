import { Page, Locator } from "@playwright/test";

export class Drawer {
  readonly page: Page;
  readonly content: Locator;
  readonly drawerOverlay: Locator;
  readonly continueButton: Locator;
  readonly closeButton: Locator;
  readonly currencyButton: (currency: string) => Locator;
  readonly accountButton: (accountName: string, index: number) => Locator;

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
}
