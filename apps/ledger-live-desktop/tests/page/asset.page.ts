import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";

export class AssetPage extends AppPage {
  private stakeButton = this.page.getByTestId("asset-detail-earn-banner");
  private buyButton = this.page.getByTestId("asset-detail-action-buy");

  @step("Wait for the stake entry")
  async waitForStakeEntry() {
    await this.stakeButton.waitFor({ state: "visible" });
  }

  @step("Start stake flow")
  async startStakeFlow() {
    await this.stakeButton.click();
    await this.page.getByText("Select account").first().waitFor({ state: "visible" });
  }

  @step("Start buy flow")
  async startBuyFlow() {
    await this.buyButton.click();
  }
}
