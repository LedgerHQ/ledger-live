import { AppPage } from "tests/page/abstractClasses";

export class MarketCoinPage extends AppPage {
  private buyButton = this.page.getByTestId("market-coin-buy-button");
  private stakeButton = this.page.getByTestId("market-coin-stake-button");

  async openBuyPage() {
    await this.buyButton.click();
    // The onBuy handler is async (fetches asset data before navigating),
    // so wait for the actual navigation to the exchange/buy page.
    await this.page.waitForURL(/.*\/exchange.*/);
  }

  async startStakeFlow() {
    await this.stakeButton.click();
    await this.page.getByText("choose account").waitFor({ state: "visible" });
    await this.page.getByText("Add account").waitFor({ state: "visible" });
  }
}
