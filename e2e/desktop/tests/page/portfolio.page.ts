import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";
import { expect, Locator } from "@playwright/test";
import { sanitizeAssetNameForTestId } from "~/mvvm/features/Assets/utils/assetTableHelpers";
import { waitForAccountsPersisted, waitForIdentitiesInAppJson } from "tests/utils/userdata";

type QuickActionButton = "receive" | "buy" | "sell" | "send";

export class PortfolioPage extends AppPage {
  private readonly buySellEntryButton = this.page.getByTestId("buy-sell-entry-button");
  private readonly embeddedSwapContainer = this.page.getByTestId("embedded-swap-container");
  private readonly stakeEntryButton = this.page.getByTestId("stake-entry-button");
  private readonly chart = this.page.getByTestId("chart-container");
  private readonly operationList = this.page.locator("#operation-list");
  private readonly assetAllocationTitle = this.page.getByText("Asset allocation");
  private readonly assetRowElements = this.page.locator(
    "[data-testid^='w40-asset-row-']:not([data-testid^='w40-asset-row-value-'])",
  );
  private readonly showAllButton = this.page.getByText("Show all");
  private readonly showMoreButton = this.page.getByText("Show more");
  private readonly w40AssetRow = (asset: string) =>
    this.page
      .locator(`[data-testid^="w40-asset-row-${sanitizeAssetNameForTestId(asset)}-"]`)
      .first();
  private readonly w40AssetRowValue = (asset: string) =>
    this.page
      .locator(`[data-testid^="w40-asset-row-value-${sanitizeAssetNameForTestId(asset)}-"]`)
      .first();
  private readonly operationRows = this.page.locator("[data-testid^='operation-row-']");

  // Wallet 4.0 elements
  private readonly portfolioBalance = this.page.getByTestId("portfolio-balance");
  private readonly portfolioTotalBalance = this.page.getByTestId("portfolio-total-balance");
  private readonly portfolioTrend = this.page.getByTestId("portfolio-trend");
  private readonly portfolioTrendPercentage = this.page.getByTestId("portfolio-trend-percentage");
  private readonly noBalanceTitle = this.page.getByTestId("no-balance-title");
  private readonly quickActionButton = (action: QuickActionButton) =>
    this.page.getByTestId(`quick-action-button-${action}`);
  private readonly connectQuickActionButton = this.page.getByTestId("quick-action-button-connect");
  private readonly buyALedgerQuickActionButton = this.page.getByTestId(
    "quick-action-button-buy-a-ledger",
  );
  private readonly portfolioAddAccountButton = this.page.getByTestId(
    "portfolio-add-account-button",
  );
  private readonly cryptoBannerAddAccountButton = this.page.getByTestId(
    "crypto-addresses-banner-add-account-cta",
  );
  /** Prefer banner CTA when both exist in DOM; Playwright picks the actionable (visible) match. */
  private readonly addAccountCta = this.cryptoBannerAddAccountButton.or(
    this.portfolioAddAccountButton,
  );
  private readonly noDeviceTitle = this.page.getByTestId("no-device-title");

  private getExpectedCounterValuePattern(counterValue: string): RegExp {
    const countervalueAliases: Record<string, RegExp> = {
      "€": /€|EUR/,
      $: /\$|USD/,
    };

    const escapedCounterValue = counterValue.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    return countervalueAliases[counterValue] ?? new RegExp(escapedCounterValue);
  }

  private async checkVisibility(locator: Locator) {
    await expect(locator).toBeVisible();
  }

  @step("Check add account button visibility")
  async checkAddAccountButtonVisibility() {
    // Wallet 4.0 + asset section: CTA lives under the Assets block and may need scroll / extra settle time.
    await this.addAccountCta.waitFor({ state: "attached" });
    await this.addAccountCta.scrollIntoViewIfNeeded();
    await expect(this.addAccountCta).toBeVisible();
  }

  @step("Click add account button")
  async clickAddAccountButton() {
    await this.addAccountCta.click();
  }

  @step("Check 'Buy/Sell' button visibility")
  async checkBuySellButtonVisibility() {
    await this.checkVisibility(this.buySellEntryButton);
  }

  @step("Click on 'Buy/Sell' button")
  async clickBuySellButton() {
    await this.buySellEntryButton.click();
  }

  @step("Check embedded swap container visibility")
  async checkEmbeddedSwapContainerVisibility() {
    await this.checkVisibility(this.embeddedSwapContainer);
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
      return (
        document.querySelectorAll(
          "[data-testid^='w40-asset-row-']:not([data-testid^='w40-asset-row-value-'])",
        ).length > 6
      );
    });
  }

  @step("Click on asset row $0")
  async clickOnSelectedAssetRow(asset: string) {
    await this.w40AssetRow(asset).click();
  }

  @step("Click stake button")
  async startStakeFlow() {
    await this.stakeEntryButton.click();
  }

  @step("Expect choose asset to be visible")
  async expectChooseAssetToBeVisible() {
    await this.page.getByText("Choose Asset").waitFor({ state: "visible" });
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

  @step("Expect total balance to display the correct counter value $0")
  async expectTotalBalanceCounterValue(counterValue: string) {
    await expect(this.portfolioTotalBalance).toBeVisible();
    await expect(this.portfolioTotalBalance).toContainText(counterValue);
  }

  @step("Expect balance diff to display the correct counter value $0")
  async expectBalanceDiffCounterValue(counterValue: string) {
    await expect(this.portfolioTrendPercentage).toBeVisible();

    // W40 trend percentage can be hidden in discreet mode and displayed as "***".
    if (counterValue === "%") {
      await expect(this.portfolioTrendPercentage).toContainText(/%|\*\*\*/);
    } else {
      await expect(this.portfolioTrendPercentage).toContainText(counterValue);
    }
  }

  @step("Expect asset row $0 to be visible")
  async expectAssetRowToBeVisible(asset: string) {
    await expect(this.w40AssetRow(asset)).toBeVisible();
  }

  @step("Expect asset row $0 to have the correct counter value $1")
  async expectAssetRowCounterValue(asset: string, counterValue: string) {
    const rowValue = this.w40AssetRowValue(asset);
    await expect(rowValue).toBeVisible();

    // W40 countervalue cells can render symbol and/or code (e.g. "€" and/or "EUR").
    if (counterValue === "€" || counterValue === "$") {
      await expect(rowValue).toContainText(this.getExpectedCounterValuePattern(counterValue));
    } else {
      await expect(rowValue).toContainText(counterValue);
    }
  }

  @step("Expect operation row to be visible")
  async expectOperationRowToBeVisible() {
    const operationRow = this.operationRows.first();
    await this.checkVisibility(operationRow);
  }

  @step("Expect operation to contain counter value $0")
  async expectOperationCounterValue(counterValue: string) {
    await this.expectOperationRowToBeVisible();
    const operationRow = this.operationRows.first();
    await expect(operationRow).toContainText(counterValue);
  }

  @step("Wait for balance to be visible")
  async expectBalanceVisibility() {
    await this.portfolioTotalBalance.waitFor({ state: "visible" });
  }

  @step("Expect app.json to be persisted with at least $1 account(s) within $2ms")
  async expectAccountsPersistedInAppJson(
    userdataFile: string,
    minCount: number = 1,
    timeoutMs: number = 5000,
  ) {
    await waitForAccountsPersisted(userdataFile, minCount, timeoutMs);
  }

  @step("Expect app.json to have identities object within $1ms")
  async expectIdentitiesPersistedInAppJson(
    userdataFile: string,
    timeoutMs: number = 10000,
  ): Promise<{ userId: string; datadogId: string; deviceIds: string[] }> {
    return waitForIdentitiesInAppJson(userdataFile, timeoutMs);
  }

  // Wallet 4.0 methods
  @step("Check one-day performance indicator visibility")
  async checkOneDayPerformanceIndicatorVisibility() {
    await this.checkVisibility(this.portfolioTrend);
  }

  @step("Click on performance pill to navigate to analytics")
  async clickOnPerformancePill() {
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

  /**
   * Synchronisation gate before add-account: waits until the empty-portfolio shell is ready.
   * Prefer this over {@link checkNoBalanceTitleVisibility} in specs so Allure shows a readiness step, not a product assertion.
   */
  @step("Wait until portfolio empty state is ready")
  async waitForPortfolioEmptyState() {
    await expect(this.noBalanceTitle).toBeVisible();
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

  @step("Check connect button is visible")
  async checkConnectButtonVisibility() {
    await this.checkVisibility(this.connectQuickActionButton);
  }

  @step("Check buy a ledger button is visible")
  async checkBuyALedgerButtonVisibility() {
    await this.checkVisibility(this.buyALedgerQuickActionButton);
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

  @step("Check no device title is visible")
  async checkNoDeviceTitleVisibility() {
    await this.checkVisibility(this.noDeviceTitle);
  }

  @step("Click send button")
  async clickSendButton() {
    await this.quickActionButton("send").click();
  }

  @step("Click sell button")
  async clickSellButton() {
    await this.quickActionButton("sell").click();
  }

  @step("Click buy button")
  async clickBuyButton() {
    await this.quickActionButton("buy").click();
  }
}
