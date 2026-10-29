import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";

export class MarketCoinPage extends AppPage {
  private readonly header = this.page.getByTestId("asset-detail-header");

  @step("Expect market coin page to be visible")
  async expectMarketCoinPageToBeVisible(currencyId: string) {
    const escaped = currencyId.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`).toLowerCase();
    await expect(this.getPage()).toHaveURL(new RegExp(`/asset/${escaped}`));
    await expect(this.header).toBeVisible();
  }
}
