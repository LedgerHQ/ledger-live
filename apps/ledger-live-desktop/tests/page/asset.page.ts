import { AppPage } from "tests/page/abstractClasses";

export class AssetPage extends AppPage {
  private stakeButton = this.page.locator("data-test-id=asset-page-stake-button");
  private buyButton = this.page.locator("data-test-id=asset-page-buy-button");

  async startStakeFlow() {
    await this.stakeButton.click();
    await this.page.getByText("Choose Account").waitFor({ state: "visible" });
  }

  async startBuyFlow() {
    await this.buyButton.click();
  }
}
