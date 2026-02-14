import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import { expect } from "@playwright/test";

export class PortfolioPage extends AppPage {
  readonly emptyStateTitle = this.page.getByTestId("portfolio-empty-state-title");
  private addAccountButton = this.page.getByTestId("portfolio-empty-state-add-account-button");
  private buySellEntryButton = this.page.getByTestId("buy-sell-entry-button");
  private swapEntryButton = this.page.getByTestId("swap-entry-button");
  private stakeEntryButton = this.page.getByTestId("stake-entry-button");
  private operationList = this.page.locator("#operation-list");
  private showAllButton = this.page.getByText("Show all");
  private assetRow = (asset: string) => this.page.getByTestId(`asset-row-${asset.toLowerCase()}`);
  private totalBalance = this.page.getByTestId("total-balance");

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
    // Wait for the asset distribution to render before interacting
    const isVisible = await assetRowLocator.isVisible();
    if (!isVisible) {
      // Asset row not immediately visible - check if "Show all" button exists
      const showAllVisible = await this.showAllButton.isVisible();
      if (showAllVisible) {
        await this.showAllButton.click();
      } else {
        // Neither visible yet - wait for the asset row to appear (distribution still loading)
        await assetRowLocator.waitFor({ state: "visible" });
      }
    }
    await assetRowLocator.click();
  }

  @step("Scroll to operations")
  async scrollToOperations() {
    await this.page.waitForTimeout(500);
    await this.operationList.scrollIntoViewIfNeeded();
  }

  @step("Expect total balance to be visible")
  async expectTotalBalanceToBeVisible() {
    expect(this.totalBalance).toBeVisible();
  }
}
