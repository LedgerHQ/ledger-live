import { expect, Locator, Page } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";
import { SwapContainer } from "tests/component/swap/swap-container";

export class AssetDetailPage extends AppPage {
  private readonly assetId: string;
  private readonly assetDetailRoot: Locator;
  readonly swapContainer: SwapContainer;

  private readonly header: Locator;
  private readonly marketPrice: Locator;
  private readonly marketPriceFiatVariation: Locator;
  private readonly totalBalance: Locator;
  private readonly addressList: Locator;
  private readonly addressRows: Locator;
  private readonly addressRowBalances: Locator;
  private readonly addAddressAction: Locator;
  private readonly transactionsSection: Locator;
  private readonly transactionRows: Locator;
  private readonly pnlCards: Locator;
  private readonly interactivePnlCard: Locator;
  private readonly optionsTrigger: Locator;
  // The staking section renders either the "earn banner" (not yet staked) or the "earn deposit"
  // card (already staked); both open the same stake flow.
  private readonly earnEntry: Locator;

  // Rendered in a portal (Lumen Dialog / Menu), so kept page-wide rather than scoped to the root.
  private readonly pnlDetailDialog = this.page.getByTestId("pnl-detail-dialog");
  private readonly addFavoriteMenuItem = this.page.getByTestId("asset-detail-add-favorite");
  private readonly removeFavoriteMenuItem = this.page.getByTestId("asset-detail-remove-favorite");

  constructor(page: Page, assetId: string) {
    super(page);
    this.assetId = assetId;
    this.assetDetailRoot = this.pageView(`asset/${this.assetId}`);
    this.swapContainer = new SwapContainer(this.assetDetailRoot, "embedded");

    const root = this.assetDetailRoot;
    this.header = root.getByTestId("asset-detail-header");
    this.marketPrice = root.getByTestId("asset-detail-market-price");
    this.marketPriceFiatVariation = root.getByTestId("asset-detail-market-price-fiat-variation");
    this.totalBalance = root.getByTestId("asset-detail-total-balance");
    this.addressList = root.getByTestId("asset-detail-address-list");
    this.addressRows = root.locator(`[data-testid^="asset-detail-address-row-"]`);
    this.addressRowBalances = root.locator(`[data-testid^="asset-detail-address-balance-"]`);
    this.addAddressAction = root.getByTestId("asset-detail-add-address");
    this.transactionsSection = root.getByTestId("asset-detail-transactions-section");
    this.transactionRows = root.locator(`[data-testid^="history-operation-row-"]`);
    this.pnlCards = root.locator(`[data-testid^="asset-detail-pnl-card-"]`);
    this.interactivePnlCard = root.getByTestId("asset-detail-pnl-card-unrealisedReturn");
    this.optionsTrigger = root.getByTestId("asset-detail-header-options-trigger");
    this.earnEntry = root
      .getByTestId("asset-detail-earn-banner")
      .or(root.getByTestId("asset-detail-earn-deposit"));
  }

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

  @step("Start the staking flow from the asset detail page")
  async startEarnFlow() {
    await this.earnEntry.first().click();
  }
}
