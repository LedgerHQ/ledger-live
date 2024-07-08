import { AppPage } from "tests/page/abstractClasses";

export class DiscoverPage extends AppPage {
  private testAppCatalogItem = this.page.getByTestId("platform-catalog-app-dummy-live-app");
  private disclaimerTitle = this.page.getByTestId("live-app-disclaimer-drawer-title");

  async openTestApp() {
    await this.testAppCatalogItem.click();
    await this.disclaimerTitle.waitFor({ state: "visible" });
  }
}
