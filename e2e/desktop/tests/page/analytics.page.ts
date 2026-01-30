import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";
import { expect } from "@playwright/test";

export class AnalyticsPage extends AppPage {
  private pageHeader = this.page.getByTestId("page-header");
  private chart = this.page.getByTestId("analytics-chart");
  private backButton = this.pageHeader.getByRole("button");

  @step("Expect analytics screen to be visible")
  async expectAnalyticsScreenToBeVisible() {
    await expect(this.pageHeader).toBeVisible();
    await expect(this.chart).toBeVisible();
  }

  @step("Click back button to return to portfolio")
  async clickBackButton() {
    await this.backButton.click();
  }
}
