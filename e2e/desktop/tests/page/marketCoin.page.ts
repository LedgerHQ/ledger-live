import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";

export class MarketCoinPage extends AppPage {
  readonly root = this.page.getByTestId("market-coin-page-container");
  readonly swapButton = this.root.getByTestId("market-coin-swap-button");

  @step("Click on swap button on asset")
  async clickSwapButton() {
    await this.swapButton.click();
  }

  @step("Expect market coin page to be visible")
  async expectMarketCoinPageToBeVisible(coinUrl: string) {
    const escaped = coinUrl.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    await expect(this.getPage()).toHaveURL(new RegExp(`/market/${escaped}`));
    await this.root.waitFor();
  }
}
