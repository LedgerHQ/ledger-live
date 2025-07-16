import { step } from "../misc/reporters/step";
import { AppPage } from "./abstractClasses";

export class AssetPage extends AppPage {
  private stakeButton = this.page.getByTestId("asset-page-stake-button");
  private buyButton = this.page.getByTestId("asset-page-buy-button");
  private swapButton = this.page.getByTestId("asset-page-swap-button");

  @step("Start stake flow")
  async startStakeFlow() {
    await this.stakeButton.click();
    await this.page.getByText("Choose Account").waitFor({ state: "visible" });
  }

  @step("Start buy flow")
  async startBuyFlow() {
    await this.buyButton.click();
  }

  @step("Start swap flow")
  async startSwapFlow() {
    await this.swapButton.click();
  }
}
