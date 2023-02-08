import { Page, Locator } from "@playwright/test";

export class AccountPage {
  readonly page: Page;
  readonly buttonsGroup: Locator;
  readonly settingsButton: Locator;
  readonly swapButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.buttonsGroup = page.locator("data-test-id=account-buttons-group");
    this.settingsButton = page.locator("data-test-id=account-settings-button");
    this.swapButton = page.locator("data-test-id=swap-account-action-button");
  }

  async navigateToSwap() {
    await this.swapButton.click();
  }
}
