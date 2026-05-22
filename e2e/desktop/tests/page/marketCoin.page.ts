import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";

export class MarketCoinPage extends AppPage {
  readonly root = this.page.getByTestId("market-coin-page-container");
  readonly swapButton = this.root.getByTestId("market-coin-swap-button");
  private readonly loadingPlaceholder = this.root.getByTestId("loading-placeholder");

  @step("Click on swap button on asset")
  async clickSwapButton() {
    await this.swapButton.click();
  }

  @step("Expect market coin page to be visible")
  async expectMarketCoinPageToBeVisible(currencyId: string) {
    const escaped = currencyId.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`).toLowerCase();
    await expect(this.getPage()).toHaveURL(new RegExp(`/market/${escaped}`));
    await this.root.waitFor({ state: "attached" });
    await expect(this.loadingPlaceholder).toHaveCount(0);
  }
}
