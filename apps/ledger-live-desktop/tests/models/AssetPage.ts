import { Page, Locator } from "@playwright/test";

export class AssetPage {
  readonly page: Page;
  readonly stakeButton: Locator;
  readonly buyButton: Locator;
  readonly swapButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.stakeButton = page.locator("data-test-id=asset-page-stake-button");
    this.buyButton = page.locator("data-test-id=asset-page-buy-button");
    this.swapButton = page.locator("data-test-id=asset-page-swap-button");
  }

  async startStakeFlow() {
    await this.stakeButton.click();
    await this.page.getByText("Choose Account").waitFor({ state: "visible" });
  }

  async startBuyFlow() {
    await this.buyButton.click();
  }

  async startSwapFlow() {
    await this.swapButton.click();
  }
}
