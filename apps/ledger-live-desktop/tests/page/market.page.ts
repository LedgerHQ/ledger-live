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
  private buyButton = (ticker: string) => this.page.getByTestId(`market-${ticker}-buy-button`);
  readonly swapButton = (ticker: string) => this.page.getByTestId(`market-${ticker}-swap-button`);
  private stakeButton = (ticker: string) => this.page.getByTestId(`market-${ticker}-stake-button`);

  @step("Search for $0")
  async search(query: string) {
    await this.searchInput.fill(query);
  }

  @step("Switch counter value for $0")
  async switchCountervalue(_ticker: string) {
    await this.counterValueSelect.click();
    // TODO: For some reason need to hack selects like that
    await this.page.click('#react-select-2-listbox div div:has-text("Thai Baht - THB")');
  }

  @step("Switch market range for $0")
  async switchMarketRange(range: string) {
    await this.marketRangeSelect.click();
    await this.page.click(`#react-select-3-listbox >> text=${range}`);
    // NOTE: this.page.click(`text=${range}`);
    // won't work on 7th row if the coin starts with d (e.g. "dogecoin")
  }

  @step("Toggle star filter")
  async toggleStarFilter() {
    await this.starFilterButton.click();
  }

  @step("Open coin page for $0")
  async openCoinPage(ticker: string) {
    await this.coinRow(ticker).click();
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
    // FIXME windows seems to be choking on the transition taking longer.
    await new Promise(resolve => setTimeout(resolve, 1000));
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

  @step("Wait for search bar to be empty")
  async waitForSearchBarToBeEmpty() {
    await this.page.waitForFunction(async () => {
      return (await this.searchInput?.inputValue()) === "";
    });
  }

  @step("Start stake flow for $0")
  async startStakeFlowByTicker(ticker: string) {
    await this.stakeButton(ticker).click();
    await this.page.getByText("choose account").waitFor({ state: "visible" });
    await this.page.getByText("Add account").waitFor({ state: "visible" });
  }

  @step("Click on stake button for $0")
  async stakeButtonClick(ticker: string) {
    await this.stakeButton(ticker.toLowerCase()).click();
  }
}
