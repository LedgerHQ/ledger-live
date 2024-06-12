import { AppPage } from "tests/page/abstractClasses";

export class MarketPage extends AppPage {
  private searchInput = this.page.locator("data-test-id=market-search-input");
  private counterValueSelect = this.page.locator("data-test-id=market-countervalue-select");
  private marketRangeSelect = this.page.locator("data-test-id=market-range-select");
  private starFilterButton = this.page.locator("data-test-id=market-star-button");
  private loadingPlaceholder = this.page.locator("data-test-id=loading-placeholder");
  private coinRow = (ticker: string) => this.page.locator(`data-test-id=market-${ticker}-row`);
  private coinPageContainer = this.page.locator(`data-test-id=market-coin-page-container`);
  private starButton = (ticker: string) =>
    this.page.locator(`data-test-id=market-${ticker}-star-button`);
  private buyButton = (ticker: string) =>
    this.page.locator(`data-test-id=market-${ticker}-buy-button`);
  readonly swapButton = (ticker: string) =>
    this.page.locator(`data-test-id=market-${ticker}-swap-button`);
  private stakeButton = (ticker: string) =>
    this.page.locator(`data-test-id=market-${ticker}-stake-button`);

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async switchCountervalue(_ticker: string) {
    await this.counterValueSelect.click();
    // TODO: For some reason need to hack selects like that
    await this.page.click('#react-select-2-listbox div div:has-text("Thai Baht - THB")');
  }

  async switchMarketRange(range: string) {
    await this.marketRangeSelect.click();
    // TODO: For some reason need to hack selects like that
    await this.page.click(`text=${range}`);
  }

  async toggleStarFilter() {
    await this.starFilterButton.click();
  }

  async openCoinPage(ticker: string) {
    await this.coinRow(ticker).click();
    await this.coinPageContainer.waitFor({ state: "attached" });
    await this.loadingPlaceholder.first().waitFor({ state: "detached" });
  }

  async starCoin(ticker: string) {
    await this.starButton(ticker).click();
  }

  async openBuyPage(ticker: string) {
    await this.buyButton(ticker).click();
    // FIXME windows seems to be choking on the transition taking longer.
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async waitForLoading() {
    await this.loadingPlaceholder.first().waitFor({ state: "detached" });
  }

  async waitForLoadingWithSwapbtn() {
    await this.loadingPlaceholder.first().waitFor({ state: "detached" });
    await this.swapButton("btc").waitFor({ state: "attached" }); // swap buttons are displayed few seconds after
  }

  async waitForSearchBarToBeEmpty() {
    await this.page.waitForFunction(async () => {
      return (await this.searchInput?.inputValue()) === "";
    });
  }

  async startStakeFlowByTicker(ticker: string) {
    await this.stakeButton(ticker).click();
    await this.page.getByText("choose account").waitFor({ state: "visible" });
    await this.page.getByText("Add account").waitFor({ state: "visible" });
  }
}
