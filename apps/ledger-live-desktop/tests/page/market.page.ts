import { AppPage } from "tests/page/abstractClasses";
import { step } from "tests/misc/reporters/step";

export class MarketPage extends AppPage {
  private searchInput = this.page.getByTestId("market-search-input");
  private counterValueSelect = this.page.getByTestId("market-countervalue-select");
  private marketRangeSelect = this.page.getByTestId("market-range-select");
  private starFilterButton = this.page.getByTestId("market-star-button");
  private loadingPlaceholder = this.page.getByTestId("loading-placeholder");
  private coinRow = (ticker: string) => this.page.getByTestId(`market-${ticker}-row`);
  private coinPageContainer = this.page.getByTestId("market-coin-page-container");
  private starButton = (ticker: string) => this.page.getByTestId(`market-${ticker}-star-button`);
  private buyButton = (ticker: string) =>
    this.page.getByTestId(`market-${ticker}-buy-button`).first();
  readonly swapButton = (ticker: string) => this.page.getByTestId(`market-${ticker}-swap-button`);
  private stakeButton = (ticker: string) => this.page.getByTestId(`market-${ticker}-stake-button`);

  @step("Search for $0")
  async search(query: string) {
    await this.searchInput.fill(query);
  }

  @step("Switch counter value for $0")
  async switchCountervalue(ticker: string) {
    await this.counterValueSelect.click();
    // Use role-based selector instead of auto-generated react-select IDs which
    // are counter-based and can shift across React versions.
    await this.page.getByRole("option", { name: new RegExp(ticker, "i") }).click();
  }

  @step("Switch market range for $0")
  async switchMarketRange(range: string) {
    await this.marketRangeSelect.click();
    await this.page.getByRole("option", { name: range }).click();
  }

  @step("Toggle star filter")
  async toggleStarFilter() {
    await this.starFilterButton.click();
  }

  @step("Open coin page for $0")
  async openCoinPage(ticker: string) {
    await this.coinRow(ticker.toLowerCase()).click();
    await this.coinPageContainer.waitFor({ state: "attached" });
    await this.loadingPlaceholder.first().waitFor({ state: "detached" });
  }

  @step("Star $0")
  async starCoin(ticker: string) {
    await this.starButton(ticker).click();
  }

  @step("Open buy page for $0")
  async openBuyPage(ticker: string) {
    await this.buyButton(ticker).click();
    // The onBuy handler is async (fetches asset data before navigating),
    // so wait for the actual navigation to the exchange/buy page.
    await this.page.waitForURL(/.*\/exchange.*/);
  }

  @step("Wait for loading")
  async waitForLoading() {
    await this.loadingPlaceholder.first().waitFor({ state: "detached" });
  }

  @step("Wait for loading with swap buttons")
  async waitForLoadingWithSwapbtn() {
    await this.loadingPlaceholder.first().waitFor({ state: "detached" });
    await this.swapButton("btc").waitFor({ state: "attached" }); // swap buttons are displayed few seconds after
  }

  @step("Start stake flow for $0")
  async startStakeFlowByTicker(ticker: string) {
    await this.stakeButton(ticker).click();
    await this.page.getByText("choose account").waitFor({ state: "visible" });
    await this.page.getByText("Add account").waitFor({ state: "visible" });
  }
}
