import { Page, Locator } from "@playwright/test";

export class Drawer {
  readonly page: Page;
  readonly content: Locator;
  readonly continueButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.content = page.locator('data-test-id=drawer-content');
    this.continueButton = page.locator('data-test-id=drawer-continue-button');
    this.closeButton = page.locator('data-test-id=drawer-close-button');
  }

  async continue() {
    await this.continueButton.click();
  }

  async waitForDrawerToDisappear() {
    await this.continueButton.waitFor({state: "detached"});
  }

  async close() {
    await this.closeButton.click();
  }
}
