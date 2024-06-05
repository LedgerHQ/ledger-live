import { AppPage } from "tests/page/abstractClasses";

export class DiscoverPage extends AppPage {
  private testAppCatalogItem = this.page.locator("#platform-catalog-app-dummy-live-app");
  private disclaimerTitle = this.page.locator("data-test-id=live-app-disclaimer-drawer-title");

  async openTestApp() {
    await this.testAppCatalogItem.click();
    await this.disclaimerTitle.waitFor({ state: "visible" });
  }
}
