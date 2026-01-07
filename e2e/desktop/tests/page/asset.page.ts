import { step } from "../misc/reporters/step";
import { AppPage } from "./abstractClasses";

export class AssetPage extends AppPage {
  private buyButton = this.page.getByTestId("asset-page-buy-button");
  private swapButton = this.page.getByTestId("asset-page-swap-button");

  @step("Start buy flow")
  async startBuyFlow() {
    await this.buyButton.click();
  }

  @step("Start swap flow")
  async startSwapFlow() {
    await this.swapButton.click();
  }
}
