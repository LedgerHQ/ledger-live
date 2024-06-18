import { Component } from "tests/page/abstractClasses";

export class Drawer extends Component {
  readonly content = this.page.locator("data-test-id=drawer-content");
  private drawerOverlay = this.page.locator("[data-test-id='drawer-overlay'][style='opacity: 1;']");
  private continueButton = this.page.locator("data-test-id=drawer-continue-button");
  private closeButton = this.page.locator("data-test-id=drawer-close-button");
  private currencyButton = (currency: string) =>
    this.page.locator(`data-test-id=currency-row-${currency.toLowerCase()}`);
  private accountButton = (accountName: string, index: number) =>
    this.page.locator(`data-test-id=account-row-${accountName.toLowerCase()}-${index}`).first();
  readonly selectAssetTitle = this.page.locator("data-test-id=select-asset-drawer-title").first();
  readonly selectAccountTitle = this.page
    .locator("data-test-id=select-account-drawer-title")
    .first();
  readonly swapAmountFrom = this.page.locator("data-test-id=swap-amount-from").first();
  readonly swapAmountTo = this.page.locator("data-test-id=swap-amount-to").first();
  readonly swapAccountFrom = this.page.locator("data-test-id=swap-account-from").first();
  readonly swapAccountTo = this.page.locator("data-test-id=swap-account-to").first();

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
