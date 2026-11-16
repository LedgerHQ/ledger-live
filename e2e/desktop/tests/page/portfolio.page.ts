import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import { expect, Locator } from "@playwright/test";
import { waitForAccountsPersisted } from "tests/utils/userdata";
import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";
import { CryptoAddressesBanner } from "tests/component/portfolio/cryptoAddressesBanner";
import { AssetsView } from "tests/component/portfolio/assetsView";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import type { SoftExpectMatcher } from "tests/utils/softExpect";

type QuickActionButton = "receive" | "buy" | "sell" | "send";

export class PortfolioPage extends AppPage {
  private readonly historyButton = this.page.getByTestId("topbar-action-button-history");
  private readonly historyTable = this.page.getByTestId("history-table");
  private readonly historyOperationRows = this.page.locator(
    "[data-testid^='history-operation-row-']",
  );
  private readonly historyOperationValue = this.page.getByTestId("history-operation-value");
  private readonly homeSideBarButton = this.page
    .getByTestId("sidebar-navigation")
    .getByRole("button", { name: "home" });
  // Wallet 4.0 elements
  private readonly portfolioBalance = this.page.getByTestId("portfolio-balance");
  private readonly portfolioTotalBalance = this.page.getByTestId("portfolio-total-balance");
  private readonly portfolioTrend = this.page.getByTestId("portfolio-trend");
  private readonly portfolioTrendPercentage = this.page.getByTestId("portfolio-trend-percentage");
  private readonly noBalanceTitle = this.page.getByTestId("no-balance-title");
  private readonly quickActionButton = (action: QuickActionButton) =>
    this.page.getByTestId(`quick-action-button-${action}`);
  private readonly quickActionsList = this.page.getByTestId("quick-actions-actions-list");
  private readonly quickActionButtons = this.quickActionsList.getByRole("button");
  private readonly connectQuickActionButton = this.page.getByTestId("quick-action-button-connect");
  private readonly buyALedgerQuickActionButton = this.page.getByTestId(
    "quick-action-button-buy-a-ledger",
  );
  public readonly cryptoAddressesBanner = new CryptoAddressesBanner(this.page);
  public readonly assetsView = new AssetsView(this.page);
  private readonly addAccountCta = this.cryptoAddressesBanner.addAccountCTA;
  private readonly noDeviceTitle = this.page.getByTestId("no-device-title");

  private readonly stocksSection = this.page.getByTestId("stocks-section");
  private readonly stocksExploreCta = this.page.getByTestId("stocks-explore");
  private readonly stocksSectionHeader = this.page.getByTestId("stocks-section-header-button");
  private readonly borrowEntryPoint = this.page.getByTestId("portfolio-borrow-entry-point");
  private readonly borrowEntryCtaButton = this.page.getByTestId("portfolio-borrow-entry-point-cta");

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

  private async checkQuickAction(assertion: (soft: SoftExpectMatcher) => Promise<void>) {
    await expect(this.quickActionsList).toBeVisible();
    await this.softExpect(assertion, { timeout: TIMEOUT.large });
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

  private async openHistoryPage() {
    await this.historyButton.click();
    await this.checkVisibility(this.historyTable);
  }

  @step("check operation history")
  async checkOperationHistory() {
    await this.openHistoryPage();
    await expect(this.historyOperationRows.first()).toBeVisible();
    await this.homeSideBarButton.click();
    await this.checkVisibility(this.portfolioTotalBalance);
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
    await this.softExpect(async soft => {
      await soft(this.portfolioTotalBalance).toHaveAttribute("aria-label", "$ 0.00");
    });
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

  @step("Expect operation to contain counter value $0")
  async expectOperationCounterValue(counterValue: string) {
    await this.openHistoryPage();
    const valueCell = this.historyOperationValue.first();
    await this.checkVisibility(valueCell);
    await expect(valueCell).toContainText(this.getExpectedCounterValuePattern(counterValue));
  }

  @step("Wait for balance to be visible")
  async expectBalanceVisibility() {
    await this.portfolioTotalBalance.waitFor({ state: "visible" });
  }

  @step("Expect app.json to be persisted with at least $1 account(s) within $2ms")
  async expectAccountsPersistedInAppJson(
    userdataFile: string,
    minCount: number = 1,
    timeoutMs: number = TIMEOUT.small,
  ) {
    await waitForAccountsPersisted(userdataFile, minCount, timeoutMs);
  }

  @step("Click asset $0 on portfolio")
  async clickAsset(currency: Currency) {
    await this.assetsView.clickAsset(currency);
  }

  @step("Expect asset $0 counter value to contain $1")
  async expectAssetValueToBe(currency: Currency, counterValue: string) {
    await this.assetsView.expectAssetValueToBe(currency, counterValue);
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
   * Zero balance / no funds. Auto-retrying, so specs also use it as the synchronisation
   * point before add-account: it only resolves once the empty-portfolio shell is ready.
   */
  @step("Expect the portfolio empty state")
  async expectPortfolioEmptyState() {
    await expect(this.noBalanceTitle).toBeVisible({ timeout: TIMEOUT.xxlarge });
  }

  @step("Expect portfolio total balance to not be visible")
  async expectPortfolioTotalBalanceNotVisible() {
    await this.softExpect(async soft => {
      await soft(this.portfolioTotalBalance).not.toBeVisible();
    });
  }

  @step("Expect one-day performance indicator to not be visible")
  async expectOneDayPerformanceIndicatorNotVisible() {
    await this.softExpect(async soft => {
      await soft(this.portfolioTrend).not.toBeVisible();
    });
  }

  @step("Check receive button is visible")
  async checkReceiveButtonVisibility() {
    await this.checkQuickAction(soft => soft(this.quickActionButton("receive")).toBeVisible());
  }

  @step("Check buy button is visible")
  async checkBuyButtonVisibility() {
    await this.checkQuickAction(soft => soft(this.quickActionButton("buy")).toBeVisible());
  }

  @step("Check connect button is visible")
  async checkConnectButtonVisibility() {
    await this.checkVisibility(this.connectQuickActionButton);
  }

  @step("Start the connect-device flow from the portfolio")
  async startConnectDeviceFlow() {
    await this.connectQuickActionButton.click();
  }

  @step("Check buy a ledger button is visible")
  async checkBuyALedgerButtonVisibility() {
    await this.checkQuickAction(soft => soft(this.buyALedgerQuickActionButton).toBeVisible());
  }

  @step("Check sell button is disabled")
  async checkSellButtonDisabled() {
    await this.checkQuickAction(soft => soft(this.quickActionButton("sell")).toBeDisabled());
  }

  @step("Check send button is disabled")
  async checkSendButtonDisabled() {
    await this.checkQuickAction(soft => soft(this.quickActionButton("send")).toBeDisabled());
  }

  @step("Check sell button is enabled")
  async checkSellButtonEnabled() {
    await this.checkQuickAction(soft => soft(this.quickActionButton("sell")).toBeEnabled());
  }

  @step("Check send button is enabled")
  async checkSendButtonEnabled() {
    await this.checkQuickAction(soft => soft(this.quickActionButton("send")).toBeEnabled());
  }

  @step("Check no device title is visible")
  async checkNoDeviceTitleVisibility() {
    await this.softExpect(
      async soft => {
        await soft(this.noDeviceTitle).toBeVisible();
      },
      { timeout: TIMEOUT.large },
    );
  }

  @step("Expect the Wallet home without a device")
  async expectNoDeviceWalletHome() {
    await expect(this.pageView("dashboard")).toBeVisible();
    await expect(this.noDeviceTitle).toBeVisible();
    await expect(this.page).not.toHaveURL(/\/onboarding/);
  }

  /** The no-device title itself is checked by `expectNoDeviceWalletHome`. */
  @step("Expect no balance in the no-device header")
  async expectNoDeviceHeader() {
    await this.softExpect(async soft => {
      await Promise.all(
        [this.portfolioBalance, this.portfolioTotalBalance, this.portfolioTrend].map(locator =>
          soft(locator).toBeHidden(),
        ),
      );
    });
  }

  /** Without a device, Receive, Buy, Sell and Send are not rendered at all, and desktop has no Swap action. */
  @step("Expect Connect and Buy a Ledger to be the only quick actions")
  async expectNoDeviceQuickActions() {
    await this.softExpect(async soft => {
      await Promise.all([
        soft(this.connectQuickActionButton).toBeVisible(),
        soft(this.buyALedgerQuickActionButton).toBeVisible(),
        soft(this.quickActionButtons).toHaveCount(2),
      ]);
    });
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
    await this.softExpect(async soft => {
      await soft(this.stocksExploreCta).not.toBeVisible();
    });
  }

  @step("Click the Stocks category title")
  async clickStocksSectionTitle() {
    await this.stocksSectionHeader.click();
  }

  @step("Expect borrow entry point to be visible")
  async expectBorrowEntryPointVisible() {
    await this.borrowEntryPoint.scrollIntoViewIfNeeded();
    await expect(this.borrowEntryPoint).toBeVisible();
  }

  @step("Click borrow entry point")
  async clickBorrowEntryPoint() {
    await this.borrowEntryCtaButton.click();
  }
}
