import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";

export class AssetDetailPage extends AppPage {
  private readonly header = this.page.getByTestId("asset-detail-header");
  private readonly marketPrice = this.page.getByTestId("asset-detail-market-price");
  private readonly marketPriceFiatVariation = this.page.getByTestId(
    "asset-detail-market-price-fiat-variation",
  );
  private readonly totalBalance = this.page.getByTestId("asset-detail-total-balance");
  private readonly addressList = this.page.getByTestId("asset-detail-address-list");
  private readonly addressRows = this.page.locator(`[data-testid^="asset-detail-address-row-"]`);
  private readonly addressRowBalances = this.page.locator(
    `[data-testid^="asset-detail-address-balance-"]`,
  );
  private readonly addAddressAction = this.page.getByTestId("asset-detail-add-address");
  private readonly transactionsSection = this.page.getByTestId("asset-detail-transactions-section");
  private readonly transactionRows = this.page.locator(`[data-testid^="history-operation-row-"]`);
  private readonly pnlCards = this.page.locator(`[data-testid^="asset-detail-pnl-card-"]`);
  private readonly interactivePnlCard = this.page.getByTestId(
    "asset-detail-pnl-card-unrealisedReturn",
  );
  private readonly pnlDetailDialog = this.page.getByTestId("pnl-detail-dialog");
  private readonly optionsTrigger = this.page.getByTestId("asset-detail-header-options-trigger");
  private readonly addFavoriteMenuItem = this.page.getByTestId("asset-detail-add-favorite");
  private readonly removeFavoriteMenuItem = this.page.getByTestId("asset-detail-remove-favorite");

  @step("Wait for asset detail page to load")
  async expectLoaded() {
    await expect(this.header).toBeVisible();
  }

  @step("Expect market info (price and fiat variation) to be visible")
  async expectMarketInfoVisible() {
    await expect(this.header).toBeVisible();
    await expect(this.marketPrice).toBeVisible();
    // Guard against the "-----" placeholder that shares the testid when price data is missing.
    await expect(this.marketPrice).not.toHaveText(/^-+$/);
    await expect(this.marketPriceFiatVariation).toBeVisible();
  }

  @step("Expect total balance to be visible")
  async expectTotalBalanceVisible() {
    await expect(this.totalBalance).toBeVisible();
  }

  @step("Expect address list to be visible")
  async expectAddressListVisible() {
    await expect(this.addressList).toBeVisible();
  }

  @step("Count holding address rows")
  async countAddressRows(): Promise<number> {
    await this.addressRows.first().waitFor({ state: "visible" });
    return this.addressRows.count();
  }

  @step("Expect each holding address row to display a balance")
  async expectAddressRowsHaveBalance() {
    const rowCount = await this.countAddressRows();
    await expect(this.addressRowBalances).toHaveCount(rowCount);
    for (let i = 0; i < rowCount; i++) {
      await expect(this.addressRowBalances.nth(i)).toBeVisible();
      await expect(this.addressRowBalances.nth(i)).toHaveText(/\d/);
    }
  }

  @step("Expect 'Add address' action to be visible")
  async expectAddAddressVisible() {
    await expect(this.addAddressAction).toBeVisible();
  }

  @step("Expect transactions section to be visible with at least one row")
  async expectTransactionsVisible() {
    await expect(this.transactionsSection).toBeVisible();
    await expect(this.transactionRows.first()).toBeVisible();
  }

  @step("Click first transaction row")
  async clickFirstTransaction() {
    await this.transactionRows.first().click();
  }

  @step("Click first holding address row")
  async clickFirstAddressRow() {
    await this.addressRows.first().click();
  }

  @step("Expect PnL cards to be visible")
  async expectPnlCardsVisible() {
    await expect(this.pnlCards.first()).toBeVisible();
  }

  @step("Open the interactive PnL card and verify the PnL detail dialog")
  async openPnlCardDetail() {
    await this.interactivePnlCard.click();
    await expect(this.pnlDetailDialog).toBeVisible();
  }

  @step("Close the PnL detail dialog")
  async closePnlCardDetail() {
    await this.page.keyboard.press("Escape");
    await expect(this.pnlDetailDialog).not.toBeVisible();
  }

  @step("Open the asset options menu")
  async openOptionsMenu() {
    await this.optionsTrigger.click();
  }

  @step("Add asset to favorites from options menu")
  async addToFavorites() {
    await this.openOptionsMenu();
    await this.addFavoriteMenuItem.click();
  }

  @step("Remove asset from favorites from options menu")
  async removeFromFavorites() {
    await this.openOptionsMenu();
    await this.removeFavoriteMenuItem.click();
  }

  @step("Expect asset to be marked as favorite")
  async expectFavorited() {
    await this.openOptionsMenu();
    await expect(this.removeFavoriteMenuItem).toBeVisible();
    await this.page.keyboard.press("Escape");
  }

  @step("Expect asset not to be marked as favorite")
  async expectNotFavorited() {
    await this.openOptionsMenu();
    await expect(this.addFavoriteMenuItem).toBeVisible();
    await this.page.keyboard.press("Escape");
  }
}
