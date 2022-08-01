import { Page, Locator } from "@playwright/test";

export class ManualPage {
  readonly page: Page;
  readonly helpButton: Locator;
  readonly languageSelect: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.helpButton = page.locator("data-test-id=manual-help-button");
    this.languageSelect = page.locator("data-test-id=manual-select");
    this.closeButton = page.locator("data-test-id=manual-close-button");
  }

  async openHelpDrawer() {
    await this.helpButton.click();
  }
}
