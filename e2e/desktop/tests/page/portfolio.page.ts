import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";
import { expect, Locator } from "@playwright/test";
import { waitForAccountsPersisted } from "tests/utils/userdata";

type QuickActionButton = "receive" | "buy" | "sell" | "send";

export class PortfolioPage extends AppPage {
  private addAccountButton = this.page.getByTestId("portfolio-empty-state-add-account-button");
  private buySellEntryButton = this.page.getByTestId("buy-sell-entry-button");
  private swapEntryButton = this.page.getByTestId("swap-entry-button");
  private stakeEntryButton = this.page.getByTestId("stake-entry-button");
  private chart = this.page.getByTestId("chart-container");
  private operationList = this.page.locator("#operation-list");
  private assetAllocationTitle = this.page.getByText("Asset allocation");
  private assetRowElements = this.page.locator("[data-testid^='asset-row-']");
  private showAllButton = this.page.getByText("Show all");
  private showMoreButton = this.page.getByText("Show more");
  private assetRow = (asset: string) => this.page.getByTestId(`asset-row-${asset.toLowerCase()}`);
  private assetRowValue = (asset: string) =>
    this.page.getByTestId(`asset-row-${asset.toLowerCase()}`).locator("//div[position()=5]");
  private operationRows = this.page.locator("[data-testid^='operation-row-']");
  private totalBalance = this.page.getByTestId("total-balance");
  private balanceDiff = this.page.getByTestId("balance-diff");

  // Wallet 4.0 elements
  private portfolioBalance = this.page.getByTestId("portfolio-balance");
  private portfolioTotalBalance = this.page.getByTestId("portfolio-total-balance");
  private portfolioTrend = this.page.getByTestId("portfolio-trend");
  private noBalanceTitle = this.page.getByTestId("no-balance-title");
  private quickActionButton = (action: QuickActionButton) =>
    this.page.getByTestId(`quick-action-button-${action}`);
  private portfolioAddAccountButton = this.page.getByTestId("portfolio-add-account-button");

  private async checkVisibility(locator: Locator) {
    await expect(locator).toBeVisible();
  }

  @step("Open `Add account` modal")
  async openAddAccountModal() {
    await this.addAccountButton.click();
  }

  @step("Check 'Buy/Sell' button visibility")
  async checkBuySellButtonVisibility() {
    await this.checkVisibility(this.buySellEntryButton);
  }

  @step("Click on 'Buy/Sell' button")
  async clickBuySellButton() {
    await this.checkBuySellButtonVisibility();
    await this.buySellEntryButton.click();
  }

  @step("Check 'Swap' button visibility")
  async checkSwapButtonVisibility() {
    await this.checkVisibility(this.swapEntryButton);
  }

  @step("Click on swap button")
  async clickSwapButton() {
    await this.swapEntryButton.click();
  }

  @step("Check 'Stake' button visibility")
  async checkStakeButtonVisibility() {
    await this.checkVisibility(this.stakeEntryButton);
  }

  @step("Check chart visibility")
  async checkChartVisibility() {
    await this.checkVisibility(this.chart);
  }

  @step("Check asset allocation section")
  async checkAssetAllocationSection() {
    await this.checkVisibility(this.assetAllocationTitle);
    await expect(this.assetRowElements).toHaveCount(6);
    await this.checkVisibility(this.showAllButton);
    await this.showAllButton.click();
    // Wait for the number of asset row elements to increase after clicking on show more button
    await this.page.waitForFunction(() => {
      return document.querySelectorAll("[data-testid^='asset-row-']").length > 6;
    });
  }

  @step("Click on asset row $0")
  async clickOnSelectedAssetRow(asset: string) {
    await this.assetRow(asset).click();
  }

  @step("Click stake button")
  async startStakeFlow() {
    await this.stakeEntryButton.click();
  }

  @step("Expect choose asset to be visible")
  async expectChooseAssetToBeVisible() {
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

  @step("check operation history")
  async checkOperationHistory() {
    await this.operationList.scrollIntoViewIfNeeded();
    await this.checkVisibility(this.operationList);

    const numberOfOperationsBefore = await this.operationRows.count();

    if (await this.showMoreButton.isVisible()) {
      await this.showMoreButton.click();
      const numberOfOperationsAfter = await this.operationRows.count();
      expect(numberOfOperationsAfter).toBeGreaterThan(numberOfOperationsBefore);
    }
  }

  @step("Expect total balance to be visible")
  async expectTotalBalanceToBeVisible() {
    await this.checkVisibility(this.totalBalance);
  }

  @step("Expect total balance to have the correct counter value $0")
  async expectTotalBalanceCounterValue(counterValue: string) {
    await this.expectTotalBalanceToBeVisible();
    await expect(this.totalBalance).toContainText(counterValue);
  }

  @step("Expect balance diff to be visible")
  async expectBalanceDiffToBeVisible() {
    await this.checkVisibility(this.balanceDiff);
  }

  @step("Expect balance diff to have the correct counter value $0")
  async expectBalanceDiffCounterValue(counterValue: string) {
    await this.expectBalanceDiffToBeVisible();
    await expect(this.balanceDiff).toContainText(counterValue);
  }

  @step("Expect asset row $0 to be visible")
  async expectAssetRowToBeVisible(asset: string) {
    await this.assetRow(asset).isVisible();
  }

  @step("Expect asset row $0 to have the correct counter value $1")
  async expectAssetRowCounterValue(asset: string, counterValue: string) {
    await this.expectAssetRowToBeVisible(asset);
    await expect(this.assetRowValue(asset)).toContainText(counterValue);
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

  @step("Wait for balance to be visible")
  async expectBalanceVisibility() {
    await this.totalBalance.waitFor({ state: "visible" });
  }

  @step("Expect app.json to be persisted with at least $1 account(s) within $2ms")
  async expectAccountsPersistedInAppJson(
    userdataFile: string,
    minCount: number = 1,
    timeoutMs: number = 5000,
  ) {
    await waitForAccountsPersisted(userdataFile, minCount, timeoutMs);
  }

  // Wallet 4.0 methods
  @step("Check portfolio total balance visibility")
  async checkPortfolioTotalBalanceVisibility() {
    await this.checkVisibility(this.portfolioTotalBalance);
  }

  @step("Check one-day performance indicator visibility")
  async checkOneDayPerformanceIndicatorVisibility() {
    await this.checkVisibility(this.portfolioTrend);
  }

  @step("Click on performance pill to navigate to analytics")
  async clickOnPerformancePill() {
    await this.checkVisibility(this.portfolioTrend);
    await this.portfolioTrend.click();
  }

  @step("Expect portfolio screen to be visible")
  async expectPortfolioScreenToBeVisible() {
    await this.checkVisibility(this.portfolioBalance);
  }

  // Zero balance / No funds methods
  @step("Check no balance title is visible")
  async checkNoBalanceTitleVisibility() {
    await this.checkVisibility(this.noBalanceTitle);
  }

  @step("Expect portfolio total balance to not be visible")
  async expectPortfolioTotalBalanceNotVisible() {
    await expect(this.portfolioTotalBalance).not.toBeVisible();
  }

  @step("Expect one-day performance indicator to not be visible")
  async expectOneDayPerformanceIndicatorNotVisible() {
    await expect(this.portfolioTrend).not.toBeVisible();
  }

  @step("Check receive button is visible")
  async checkReceiveButtonVisibility() {
    await this.checkVisibility(this.quickActionButton("receive"));
  }

  @step("Check buy button is visible")
  async checkBuyButtonVisibility() {
    await this.checkVisibility(this.quickActionButton("buy"));
  }

  @step("Check sell button is disabled")
  async checkSellButtonDisabled() {
    await expect(this.quickActionButton("sell")).toBeDisabled();
  }

  @step("Check send button is disabled")
  async checkSendButtonDisabled() {
    await expect(this.quickActionButton("send")).toBeDisabled();
  }

  @step("Check sell button is enabled")
  async checkSellButtonEnabled() {
    await expect(this.quickActionButton("sell")).toBeEnabled();
  }

  @step("Check send button is enabled")
  async checkSendButtonEnabled() {
    await expect(this.quickActionButton("send")).toBeEnabled();
  }

  @step("Check add account button visibility")
  async checkAddAccountButtonVisibility() {
    await this.checkVisibility(this.portfolioAddAccountButton);
  }

  @step("Click add account button")
  async clickAddAccountButton() {
    await this.portfolioAddAccountButton.click();
  }
}
