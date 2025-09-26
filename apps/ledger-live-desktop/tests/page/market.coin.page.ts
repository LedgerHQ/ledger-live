import { AppPage } from "tests/page/abstractClasses";

export class MarketCoinPage extends AppPage {
  private buyButton = this.page.getByTestId("market-coin-buy-button");
  private stakeButton = this.page.getByTestId("market-coin-stake-button");

  async openBuyPage(name: string) {
    await this.buyButton.click();
    await this.page.getByText(`${name}`).waitFor({ state: "visible" });
    await this.page.click(`text=${name}`);
    // FIXME windows seems to be choking on the transition taking longer.
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async startStakeFlow() {
    await this.stakeButton.click();
    await this.page.getByText("choose account").waitFor({ state: "visible" });
    await this.page.getByText("Add account").waitFor({ state: "visible" });
  }
}
