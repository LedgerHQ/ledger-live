import { Page, Locator } from "@playwright/test";

export class DiscoverPage {
  readonly page: Page;
  readonly testAppCatalogItem: Locator;
  readonly disclaimerTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.testAppCatalogItem = page.locator("#platform-catalog-app-dummy-live-app");
    this.disclaimerTitle = page.locator("data-test-id=live-app-disclaimer-drawer-title");
  }

  async openTestApp() {
    await this.testAppCatalogItem.click();
    await this.disclaimerTitle.waitFor({ state: "visible" });
  }
}
