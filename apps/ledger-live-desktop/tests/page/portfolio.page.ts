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
  private operationRows = this.page.locator("[data-testid^='operation-row-']");

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
}
