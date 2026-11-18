import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import { coinDetailUrlPattern } from "tests/utils/urlUtils";

export class MarketCoinPage extends AppPage {
  private readonly header = this.page.getByTestId("asset-detail-header");

  @step("Expect market coin page to be visible")
  async expectMarketCoinPageToBeVisible(currencyId: string) {
    await expect(this.page).toHaveURL(coinDetailUrlPattern(currencyId.toLowerCase()));
    await expect(this.header).toBeVisible();
  }
}
