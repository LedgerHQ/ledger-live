import { AppPage } from "tests/page/abstractClasses";

export class AssetPage extends AppPage {
  private stakeButton = this.page.getByTestId("asset-page-stake-button");
  private buyButton = this.page.getByTestId("asset-page-buy-button");

  async startStakeFlow() {
    await this.stakeButton.click();
    await this.page.getByText("Choose Account").waitFor({ state: "visible" });
  }

  async startBuyFlow() {
    await this.buyButton.click();
  }
}
