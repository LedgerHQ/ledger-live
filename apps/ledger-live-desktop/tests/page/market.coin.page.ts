import { AppPage } from "tests/page/abstractClasses";

export class MarketCoinPage extends AppPage {
  private buyButton = this.page.getByTestId("market-coin-buy-button");
  private stakeButton = this.page.getByTestId("market-coin-stake-button");

  async openBuyPage() {
    await this.buyButton.click();
  }

  async startStakeFlow() {
    await this.stakeButton.click();
    await this.page.getByText("choose account").waitFor({ state: "visible" });
    await this.page.getByText("Add account").waitFor({ state: "visible" });
  }
}
