import { Page, Locator } from "@playwright/test";

export class PortfolioPage {
  readonly page: Page;
  readonly portfolioContainer: Locator;
  readonly emptyStateTitle: Locator;
  readonly addAccountButton: Locator;
  readonly buySellEntryButton: Locator;
  readonly swapEntryButton: Locator;
  readonly stakeEntryButton: Locator;
  readonly assetRow: (currency: string) => Locator;

  constructor(page: Page) {
    this.page = page;
    this.portfolioContainer = page.locator("data-test-id=portfolio-container");
    this.emptyStateTitle = page.locator("data-test-id=portfolio-empty-state-title");
    this.addAccountButton = page.locator("data-test-id=portfolio-empty-state-add-account-button");
    this.buySellEntryButton = page.locator("data-test-id=buy-sell-entry-button");
    this.swapEntryButton = page.locator("data-test-id=swap-entry-button");
    this.stakeEntryButton = page.locator("data-test-id=stake-entry-button");
    this.assetRow = currency => page.locator(`data-test-id=asset-row-${currency.toLowerCase()}`);
  }

  async openAddAccountModal() {
    await this.addAccountButton.click();
  }

  async startBuyFlow() {
    await this.buySellEntryButton.click();
  }

  async startSwapFlow() {
    await this.swapEntryButton.click();
  }

  async startStakeFlow() {
    await this.stakeEntryButton.click();
    await this.page.getByText("Choose Asset").waitFor({ state: "visible" });
  }

  async navigateToAsset(currency: string) {
    this.assetRow(currency).click();
  }

  async scrollToOperations() {
    await this.page.waitForTimeout(500);
    const operationList = this.page.locator("id=operation-list");
    await operationList.scrollIntoViewIfNeeded();
  }
}
