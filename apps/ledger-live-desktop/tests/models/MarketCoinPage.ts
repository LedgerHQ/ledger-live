import { Page, Locator } from "@playwright/test";

export class MarketCoinPage {
  readonly page: Page;
  readonly buyButton: Locator;
  readonly swapButton: Locator;
  readonly counterValueSelect: Locator;
  readonly marketRangeSelect: Locator;
  readonly starFilterButton: Locator;
  readonly stakeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.buyButton = page.locator("data-test-id=market-coin-buy-button");
    this.swapButton = page.locator("data-test-id=market-coin-swap-button");
    this.counterValueSelect = page.locator("data-test-id=market-coin-counter-value-select");
    this.marketRangeSelect = page.locator("data-test-id=market-coin-range-select");
    this.starFilterButton = page.locator("data-test-id=market-coin-star-button");
    this.stakeButton = page.locator(`data-test-id=market-coin-stake-button`);
  }

  async openBuyPage() {
    await this.buyButton.click();
  }

  async openSwapPage() {
    await this.swapButton.click();
  }

  async startStakeFlow() {
    await this.stakeButton.click();
    await this.page.getByText("choose account").waitFor({ state: "visible" });
    await this.page.getByText("Add account").waitFor({ state: "visible" });
  }
}
