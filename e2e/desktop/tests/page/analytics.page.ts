import { step } from "tests/misc/reporters/step";
import { expect } from "@playwright/test";
import { AppPage } from "tests/page/abstractClasses";
import { PageHeader } from "tests/component/pageHeader.component";

export class AnalyticsPage extends AppPage {
  readonly header = new PageHeader(this.page);
  private readonly chart = this.page.getByTestId("analytics-chart");

  @step("Expect analytics screen to be visible")
  async expectAnalyticsScreenToBeVisible() {
    await expect(this.header.root).toBeVisible();
    await expect(this.chart).toBeVisible();
  }
}
