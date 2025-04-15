import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";

export class AssetPage extends AppPage {
  private stakeButton = this.page.getByTestId("asset-page-stake-button");
  private buyButton = this.page.getByTestId("asset-page-buy-button");

  @step("Start stake flow")
  async startStakeFlow() {
    await this.stakeButton.click();
    await this.page.getByText("Choose Account").waitFor({ state: "visible" });
  }

  @step("Start buy flow")
  async startBuyFlow() {
    await this.buyButton.click();
  }
}
