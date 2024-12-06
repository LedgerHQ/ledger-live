import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import { expect } from "@playwright/test";

export class PortfolioPage extends AppPage {
  readonly emptyStateTitle = this.page.getByTestId("portfolio-empty-state-title");
  private addAccountButton = this.page.getByTestId("portfolio-empty-state-add-account-button");
  private buySellEntryButton = this.page.getByTestId("buy-sell-entry-button");
  private swapEntryButton = this.page.getByTestId("swap-entry-button");
  private stakeEntryButton = this.page.getByTestId("stake-entry-button");
  private chart = this.page.getByTestId("chart-container");
  private operationList = this.page.locator("#operation-list");
  private marketPerformanceWidget = this.page.getByTestId("market-performance-widget");
  private swapButton = this.marketPerformanceWidget.getByRole("button", { name: "Swap" });
  private buyButton = this.marketPerformanceWidget.getByRole("button", { name: "Buy" });
  private assetAllocationTitle = this.page.getByText("Asset allocation");
  private trendTitle = this.marketPerformanceWidget.getByText("1W trend");
  private assetRowElements = this.page.locator("[data-testid^='asset-row-']");
  private showAllButton = this.page.getByText("Show all");
  private showMoreButton = this.page.getByText("Show more");
  private assetRow = (asset: string) => this.page.getByTestId(`asset-row-${asset.toLowerCase()}`);
  private assetRowValue = (asset: string) =>
    this.page.getByTestId(`asset-row-${asset.toLowerCase()}`).locator("//div[position()=5]");
  private operationRows = this.page.locator("[data-testid^='operation-row-']");
  private totalBalance = this.page.getByTestId("total-balance");
  private balanceDiff = this.page.getByTestId("balance-diff");

  @step("Open `Add account` modal")
  async openAddAccountModal() {
    await this.addAccountButton.click();
  }

  @step("Check 'Buy/Sell' button visibility")
  async checkBuySellButtonVisibility() {
    await expect(this.buySellEntryButton).toBeVisible();
  }

  @step("Check 'Swap' button visibility")
  async checkSwapButtonVisibility() {
    await expect(this.swapEntryButton).toBeVisible();
  }

  @step("Check 'Stake' button visibility")
  async checkStakeButtonVisibility() {
    await expect(this.stakeEntryButton).toBeVisible();
  }

  @step("Check chart visibility")
  async checkChartVisibility() {
    await expect(this.chart).toBeVisible();
  }

  @step("Check market performance trend visibility")
  async checkMarketPerformanceTrendVisibility() {
    await expect(this.marketPerformanceWidget).toBeVisible();
    await expect(this.trendTitle).toBeVisible();
    await expect(this.buyButton).toBeVisible();
    await expect(this.swapButton).toBeVisible();
  }

  @step("Check asset allocation section")
  async checkAssetAllocationSection() {
    await expect(this.assetAllocationTitle).toBeVisible();
    await expect(this.assetRowElements).toHaveCount(6);
    await expect(this.showAllButton).toBeVisible();
    await this.showAllButton.click();
    // Wait for the number of asset row elements to increase after clicking on show more button
    await this.page.waitForFunction(() => {
      return document.querySelectorAll("[data-testid^='asset-row-']").length > 6;
    });
  }

  async startBuyFlow() {
    await this.buySellEntryButton.click();
  }

  @step("Click stake button")
  async startStakeFlow() {
    await this.stakeEntryButton.click();
    await this.page.getByText("Choose Asset").waitFor({ state: "visible" });
  }

  @step("Navigate to asset $0")
  async navigateToAsset(asset: string) {
    const assetRowLocator = this.assetRow(asset);
    if (!(await assetRowLocator.isVisible())) {
      await this.showAllButton.click();
    }
    await assetRowLocator.click();
  }

  @step("Scroll to operations")
  async scrollToOperations() {
    await this.page.waitForTimeout(500);
    await this.operationList.scrollIntoViewIfNeeded();
  }

  @step("check operation history")
  async checkOperationHistory() {
    await this.operationList.scrollIntoViewIfNeeded();
    expect(await this.operationList).toBeVisible();

    const numberOfOperationsBefore = await this.operationRows.count();

    if (await this.showMoreButton.isVisible()) {
      await this.showMoreButton.click();
      const numberOfOperationsAfter = await this.operationRows.count();
      expect(numberOfOperationsAfter).toBeGreaterThan(numberOfOperationsBefore);
    }
  }

  @step("Expect total balance to be visible")
  async expectTotalBalanceToBeVisible() {
    expect(this.totalBalance).toBeVisible();
  }

  @step("Expect total balance to have the correct counter value $0")
  async expectTotalBalanceCounterValue(counterValue: string) {
    await this.expectTotalBalanceToBeVisible();
    expect(this.totalBalance).toContainText(counterValue);
  }

  @step("Expect balance diff to be visible")
  async expectBalanceDiffToBeVisible() {
    expect(this.balanceDiff).toBeVisible();
  }

  @step("Expect balance diff to have the correct counter value $0")
  async expectBalanceDiffCounterValue(counterValue: string) {
    await this.expectBalanceDiffToBeVisible();
    expect(this.balanceDiff).toContainText(counterValue);
  }

  @step("Expect asset row $0 to be visible")
  async expectAssetRowToBeVisible(asset: string) {
    await this.assetRow(asset).isVisible();
  }

  @step("Expect asset row $0 to have the correct counter value $1")
  async expectAssetRowCounterValue(asset: string, counterValue: string) {
    await this.expectAssetRowToBeVisible(asset);
    expect(this.assetRowValue(asset)).toContainText(counterValue);
  }

  @step("Expect operation row to be visible")
  async expectOperationRowToBeVisible() {
    const operationRow = this.operationRows.first();
    await operationRow.isVisible();
  }

  @step("Expect operation to contain counter value $0")
  async expectOperationCounterValue(counterValue: string) {
    await this.expectOperationRowToBeVisible();
    const operationRow = this.operationRows.first();
    await expect(operationRow).toContainText(counterValue);
  }
}
