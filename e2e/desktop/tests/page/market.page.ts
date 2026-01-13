import { AppPage } from "./abstractClasses";
import { step } from "../misc/reporters/step";

export class MarketPage extends AppPage {
  private searchInput = this.page.getByTestId("market-search-input");
  private loadingPlaceholder = this.page.getByTestId("loading-placeholder");
  private coinRow = (ticker: string) => this.page.getByTestId(`market-${ticker}-row`);
  private coinPageContainer = this.page.getByTestId("market-coin-page-container");
  private buyButton = (ticker: string) =>
    this.page.getByTestId(`market-${ticker}-buy-button`).first();
  readonly swapButton = (ticker: string) => this.page.getByTestId(`market-${ticker}-swap-button`);
  private stakeButton = (ticker: string) => this.page.getByTestId(`market-${ticker}-stake-button`);
  private swapButtonOnAsset = this.page.getByTestId("market-coin-swap-button");

  @step("Search for $0")
  async search(query: string) {
    await this.searchInput.fill(query);
  }

  @step("Open coin page for $0")
  async openCoinPage(ticker: string) {
    await this.coinRow(ticker.toLowerCase()).click();
    await this.coinPageContainer.waitFor({ state: "attached" });
    await this.loadingPlaceholder.first().waitFor({ state: "detached" });
  }

  @step("Open buy page for $0")
  async openBuyPage(ticker: string) {
    await this.buyButton(ticker.toLowerCase()).click();
  }

  @step("Click on swap button for $0")
  async startSwapForSelectedTicker(ticker: string) {
    await this.swapButton(ticker.toLowerCase()).click();
  }

  @step("Click on swap button on asset")
  async clickOnSwapButtonOnAsset() {
    await this.swapButtonOnAsset.click();
  }

  @step("Click on stake button for $0")
  async stakeButtonClick(ticker: string) {
    await this.stakeButton(ticker.toLowerCase()).click();
  }
}
