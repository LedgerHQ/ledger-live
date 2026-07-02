import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";
import { expect, Locator } from "@playwright/test";
import { waitForAccountsPersisted, waitForIdentitiesInAppJson } from "tests/utils/userdata";
import { isAssetSectionEnabled, isOperationsListEnabled } from "tests/utils/featureFlagUtils";
import { CryptoAddressesBanner } from "../component/portfolio/cryptoAddressesBanner";
import { AssetsView } from "tests/component/portfolio/assetsView";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";

type QuickActionButton = "receive" | "buy" | "sell" | "send";

export class PortfolioPage extends AppPage {
  private readonly buySellEntryButton = this.page.getByTestId("buy-sell-entry-button");
  private readonly embeddedSwapContainer = this.page.getByTestId("embedded-swap-container");
  private readonly stakeEntryButton = this.page.getByTestId("stake-entry-button");
  private readonly chart = this.page.getByTestId("chart-container");
  private readonly operationList = this.page.locator("#operation-list");
  private readonly historyButton = this.page.getByTestId("topbar-action-button-history");
  private readonly historyTable = this.page.getByTestId("history-table");
  private readonly historyOperationRows = this.page.locator(
    "[data-testid^='history-operation-row-']",
  );
  private readonly historyOperationValue = this.page.getByTestId("history-operation-value");
  private readonly homeSideBarButton = this.page
    .getByTestId("sidebar-navigation")
    .getByRole("button", { name: "home" });
  private readonly showMoreButton = this.page.getByText("Show more");
  private readonly operationRows = this.page.getByTestId(/operation-row-.*/);

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
  public readonly cryptoAddressesBanner = new CryptoAddressesBanner(this.page);
  public readonly assetsView = new AssetsView(this.page);
  // Legacy portfolio (Asset Section OFF) AssetDistribution row, keyed by the lowercased currency name.
  private readonly legacyAssetRow = (currency: Currency) =>
    this.page.getByTestId(`asset-row-${currency.name.toLowerCase()}`);
  // Legacy Wallet (Asset Section OFF) add-account button.
  private readonly portfolioAddAccountButton = this.page.getByTestId(
    "portfolio-add-account-button",
  );
  /**
   * Mode-tolerant add-account button: W40 banner CTA (Asset Section ON) or the legacy
   * portfolio button (OFF). Both can coexist in the DOM; Playwright resolves the actionable match.
   */
  private readonly addAccountCta = this.cryptoAddressesBanner.addAccountCTA.or(
    this.portfolioAddAccountButton,
  );
  private readonly noDeviceTitle = this.page.getByTestId("no-device-title");

  private readonly stocksSection = this.page.getByTestId("stocks-section");
  private readonly stocksExploreCta = this.page.getByTestId("stocks-explore");
  private readonly stocksSectionHeader = this.page.getByTestId("stocks-section-header-button");

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

  @step("Expect add account button to be visible")
  async expectAddAccountButtonVisible() {
    // CTA may live under the Assets block (W40) and need scroll / extra settle time.
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

  @step("Click stake button")
  async startStakeFlow() {
    await this.stakeEntryButton.click();
  }

  @step("Expect choose asset to be visible")
  async expectChooseAssetToBeVisible() {
    await this.page.getByText("Choose Asset").waitFor({ state: "visible" });
  }

  private async openHistoryPage() {
    await this.historyButton.click();
    await this.checkVisibility(this.historyTable);
  }

  @step("check operation history")
  async checkOperationHistory() {
    if (await isOperationsListEnabled(this.page)) {
      await this.openHistoryPage();
      await expect(this.historyOperationRows.first()).toBeVisible();
      await this.homeSideBarButton.click();
      await this.checkVisibility(this.portfolioTotalBalance);
    } else {
      await this.operationList.scrollIntoViewIfNeeded();
      await this.checkVisibility(this.operationList);

      const numberOfOperationsBefore = await this.operationRows.count();

      if (await this.showMoreButton.isVisible()) {
        await this.showMoreButton.click();
        const numberOfOperationsAfter = await this.operationRows.count();
        expect(numberOfOperationsAfter).toBeGreaterThan(numberOfOperationsBefore);
      }
    }
  }

  @step("Expect total balance to display the correct counter value $0")
  async expectTotalBalanceCounterValue(counterValue: string) {
    await expect(this.portfolioTotalBalance).toBeVisible();
    await expect(this.portfolioTotalBalance).toContainText(counterValue);
  }

  @step("Expect total balance to be zero")
  async expectTotalBalanceToBeZero() {
    await expect(this.portfolioTotalBalance).toBeVisible();
    // DisplayAmount animation pollutes textContent with hidden digits; aria-label keeps the clean amount.
    await expect(this.portfolioTotalBalance).toHaveAttribute("aria-label", "$ 0.00");
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

  @step("Expect operation row to be visible")
  async expectOperationRowToBeVisible() {
    if (await isOperationsListEnabled(this.page)) {
      await this.openHistoryPage();
      await this.checkVisibility(this.historyOperationRows.first());
    } else {
      await this.checkVisibility(this.operationRows.first());
    }
  }

  @step("Expect operation to contain counter value $0")
  async expectOperationCounterValue(counterValue: string) {
    if (await isOperationsListEnabled(this.page)) {
      await this.openHistoryPage();
      const valueCell = this.historyOperationValue.first();
      await this.checkVisibility(valueCell);
      await expect(valueCell).toContainText(this.getExpectedCounterValuePattern(counterValue));
    } else {
      await this.expectOperationRowToBeVisible();
      const operationRow = this.operationRows.first();
      await expect(operationRow).toContainText(counterValue);
    }
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

  /**
   * Click an asset row on the portfolio, in either UI variant.
   * Asset Section ON  → Wallet 4.0 {@link AssetsView} row.
   * Asset Section OFF → legacy AssetDistribution row.
   */
  @step("Click asset $0 on portfolio")
  async clickAsset(currency: Currency) {
    if (await isAssetSectionEnabled(this.page)) {
      await this.assetsView.clickAsset(currency);
    } else {
      await this.legacyAssetRow(currency).click();
    }
  }

  /**
   * Assert an asset row's counter value, in either UI variant.
   * Asset Section ON  → dedicated W40 value cell. OFF → legacy row (contains price + counter value).
   */
  @step("Expect asset $0 counter value to contain $1")
  async expectAssetValueToBe(currency: Currency, counterValue: string) {
    if (await isAssetSectionEnabled(this.page)) {
      await this.assetsView.expectAssetValueToBe(currency, counterValue);
      return;
    }

    const rowValue = this.legacyAssetRow(currency);
    await expect(rowValue).toBeVisible();
    // Countervalue cells can render symbol and/or code (e.g. "€" and/or "EUR").
    if (counterValue === "€" || counterValue === "$") {
      await expect(rowValue).toContainText(this.getExpectedCounterValuePattern(counterValue));
    } else {
      await expect(rowValue).toContainText(counterValue);
    }
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

  @step("Expect Stocks discovery (empty) section to be visible")
  async expectStocksDiscoveryVisible() {
    await expect(this.stocksSection).toBeVisible();
    await expect(this.stocksExploreCta).toBeVisible();
  }

  @step("Click 'Explore all' in the Stocks discovery section")
  async clickStocksExploreAll() {
    await this.stocksExploreCta.click();
  }

  @step("Expect Stocks holdings section to be visible")
  async expectStocksHoldingsVisible() {
    await this.stocksSection.scrollIntoViewIfNeeded();
    await expect(this.stocksSection).toBeVisible();
    await expect(this.stocksExploreCta).not.toBeVisible();
  }

  @step("Click the Stocks category title")
  async clickStocksSectionTitle() {
    await this.stocksSectionHeader.click();
  }
}
