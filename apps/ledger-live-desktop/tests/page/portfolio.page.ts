import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";

export class PortfolioPage extends AppPage {
  readonly emptyStateTitle = this.page.locator("data-test-id=portfolio-empty-state-title");
  private addAccountButton = this.page.locator(
    "data-test-id=portfolio-empty-state-add-account-button",
  );
  private buySellEntryButton = this.page.locator("data-test-id=buy-sell-entry-button");
  private stakeEntryButton = this.page.locator("data-test-id=stake-entry-button");
  private showAllButton = this.page.locator("text=Show all");
  private assetRow = (currency: string) =>
    this.page.locator(`data-test-id=asset-row-${currency.toLowerCase()}`);

  @step("Open `Add account` modal")
  async openAddAccountModal() {
    await this.addAccountButton.click();
  }

  async startBuyFlow() {
    await this.buySellEntryButton.click();
  }

  async startStakeFlow() {
    await this.stakeEntryButton.click();
    await this.page.getByText("Choose Asset").waitFor({ state: "visible" });
  }

  @step("Navigate to asset $0")
  async navigateToAsset(currency: string) {
    const assetRowLocator = this.assetRow(currency);
    if (!(await assetRowLocator.isVisible())) {
      await this.showAllButton.click();
    }
    await assetRowLocator.click();
  }

  async scrollToOperations() {
    await this.page.waitForTimeout(500);
    const operationList = this.page.locator("id=operation-list");
    await operationList.scrollIntoViewIfNeeded();
  }
}
