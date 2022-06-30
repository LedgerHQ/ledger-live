import { Page, Locator } from "@playwright/test";

export class Drawer {
  readonly page: Page;
  readonly content: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.content = page.locator('data-test-id=drawer-content');
    this.closeButton = page.locator('data-test-id=drawer-close-button');
  }

  async close() {
    await this.closeButton.click();
  }
}
