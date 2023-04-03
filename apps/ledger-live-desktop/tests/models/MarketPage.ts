import { Page, Locator } from "@playwright/test";

export class MarketPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly counterValueSelect: Locator;
  readonly marketRangeSelect: Locator;
  readonly filterDrawerButton: Locator;
  readonly starFilterButton: Locator;
  readonly loadingPlaceholder: Locator;
  readonly coinRow: (ticker: string) => Locator;
  readonly coinPageContainer: Locator;
  readonly starButton: (ticker: string) => Locator;
  readonly buyButton: (ticker: string) => Locator;
  readonly swapButton: (ticker: string) => Locator;
  readonly stakeButton: (ticker: string) => Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator("data-test-id=market-search-input");
    this.counterValueSelect = page.locator("data-test-id=market-countervalue-select");
    this.marketRangeSelect = page.locator("data-test-id=market-range-select");
    this.filterDrawerButton = page.locator("data-test-id=market-filter-drawer-button");
    this.starFilterButton = page.locator("data-test-id=market-star-button");
    this.loadingPlaceholder = page.locator("data-test-id=loading-placeholder");
    this.coinRow = ticker => page.locator(`data-test-id=market-${ticker}-row`);
    this.coinPageContainer = page.locator(`data-test-id=market-coin-page-container`);
    this.starButton = ticker => page.locator(`data-test-id=market-${ticker}-star-button`);
    this.buyButton = ticker => page.locator(`data-test-id=market-${ticker}-buy-button`);
    this.swapButton = ticker => page.locator(`data-test-id=market-${ticker}-swap-button`);
    this.stakeButton = ticker => page.locator(`data-test-id=market-${ticker}-stake-button`);
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async openFilterDrawer() {
    await this.filterDrawerButton.click();
  }

  async switchCountervalue(ticker: string) {
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
  }

  async openSwapPage(ticker: string) {
    await this.swapButton(ticker).click();
  }

  async waitForLoading() {
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
