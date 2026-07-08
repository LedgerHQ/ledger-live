import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";

export class MarketCoinPage extends AppPage {
  readonly root = this.page.getByTestId("market-coin-page-container");
  readonly swapButton = this.root.getByTestId("market-coin-swap-button");
  private readonly coinPageContainer = this.root.or(this.page.getByTestId("asset-detail-header"));
  private readonly loadingPlaceholder = this.root.getByTestId("loading-placeholder");

  @step("Click on swap button on asset")
  async clickSwapButton() {
    await this.swapButton.click();
  }

  @step("Expect market coin page to be visible")
  async expectMarketCoinPageToBeVisible(currencyId: string) {
    const escaped = currencyId.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`).toLowerCase();
    // Accept both routes: aggregatedAssets ON serves `/asset/:id`, OFF serves `/market/:id`.
    await expect(this.getPage()).toHaveURL(new RegExp(`/(asset|market)/${escaped}`));
    await this.coinPageContainer.first().waitFor({ state: "attached" });
    await expect(this.loadingPlaceholder).toHaveCount(0);
  }
}
