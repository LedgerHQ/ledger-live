import { AppPage } from "tests/page/abstractClasses";

export class DiscoverPage extends AppPage {
  private testAppCatalogItem = this.page.getByTestId("platform-catalog-app-dummy-live-app");
  private disclaimerTitle = this.page.getByTestId("live-app-disclaimer-drawer-title");
  private catalogApp = this.page
    .locator("[data-testid^='platform-catalog-app-'], [id^='platform-catalog-app-']")
    .first();

  async waitForDiscoverVisible() {
    await this.page.waitForURL(/\/platform(?:\/|$|\?|#)/);
    await this.catalogApp.waitFor({ state: "visible" });
  }

  async openTestApp() {
    await this.testAppCatalogItem.click();
    await this.disclaimerTitle.waitFor({ state: "visible" });
  }
}
