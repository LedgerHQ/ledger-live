import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import { expect } from "@playwright/test";

export class PortfolioPage extends AppPage {
  private addAccountButton = this.page.getByTestId("portfolio-add-account-button");
  // private buySellEntryButton = this.page.getByTestId("buy-sell-entry-button");
  private buyQuickActionButton = this.page.getByTestId("quick-action-button-buy");
  private sellQuickActionButton = this.page.getByTestId("quick-action-button-sell");
  private embeddedSwapContainer = this.page.getByTestId("embedded-swap-container");
  // private stakeEntryButton = this.page.getByTestId("stake-entry-button");
  private readonly sidebarNavigation = this.page.getByTestId("sidebar-navigation");
  private stakeEntryButton = this.sidebarNavigation
    .getByRole("button", { name: /^(earn|stake|yield)$/i })
    .or(this.page.getByTestId("drawer-earn-button"));
  private operationList = this.page.locator("#operation-list");
  private showAllButton = this.page.getByText("Show all");
  private assetRow = (asset: string) => this.page.getByTestId(`asset-row-${asset.toLowerCase()}`);
  private totalBalance = this.page.getByTestId("total-balance");

  @step("Open `Add account` modal")
  async openAddAccountModal() {
    await this.addAccountButton.click();
  }

  @step("Expect portfolio to be in empty mode")
  async expectEmptyPortfolio() {
    await expect(this.addAccountButton).toBeVisible();
  }

  @step("Check 'Buy/Sell' button visibility")
  async checkBuySellButtonVisibility() {
    await expect(this.buyQuickActionButton).toBeVisible();
    await expect(this.sellQuickActionButton).toBeVisible();
  }

  @step("Check embedded swap container visibility")
  async checkEmbeddedSwapContainerVisibility() {
    await expect(this.embeddedSwapContainer).toBeVisible();
  }

  @step("Check 'Stake' button visibility")
  async checkStakeButtonVisibility() {
    await expect(this.stakeEntryButton).toBeVisible();
  }

  @step("Click Buy quick action")
  async startBuyFlow() {
    await this.buyQuickActionButton.click();
    await expect(this.page).toHaveURL(/\/exchange(?:\/|$|\?|#)/);
  }

  @step("Click stake button")
  async startStakeFlow() {
    await this.stakeEntryButton.click();
    await expect(this.page).toHaveURL(/\/earn(?:\/|$|\?|#)/);
    // await this.page.getByText("Select asset").first().waitFor({ state: "visible" });
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
    // Wait for the operation list to be attached before scrolling (React 19 deferred rendering)
    await this.operationList.waitFor({ state: "attached" });
    await this.operationList.scrollIntoViewIfNeeded();
  }

  @step("Expect total balance to be visible")
  async expectTotalBalanceToBeVisible() {
    expect(this.totalBalance).toBeVisible();
  }
}
