import { expect, type Page } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { WebViewAppPage } from "tests/page/webViewApp.page";
import { INTERVAL, TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";
import type { PerpsMarketGroup } from "tests/utils/perpsMarkets";

export type PerpsOrderSide = "long" | "short";

type AutoCloseOffsets = { takeProfit: string; stopLoss: string };

// Quick options are price offsets, not ROE.
const AUTO_CLOSE_OFFSETS = {
  long: { takeProfit: "+10%", stopLoss: "-5%" },
  short: { takeProfit: "-5%", stopLoss: "+5%" },
} satisfies Record<PerpsOrderSide, AutoCloseOffsets>;

const MIN_ORDER_NOTIONAL_USD = 12;
const MARGIN_TOLERANCE_USD = 0.5;

export type ProviderPosition = { marketId: string; symbol: string };

const autoCloseSummary = /Take profit \$([\d,.]+), Stop loss \$([\d,.]+)/;

const usdAmount = /\$([\d,.]+)/;

const offsetToFactor = (offset: string) => 1 + Number.parseFloat(offset) / 100;

const parseAmount = (text: string) => Number.parseFloat(text.replaceAll(",", ""));

// NaN while the button shows no amount yet, so a poll keeps waiting.
const readUsdAmount = (text: string) => parseAmount(usdAmount.exec(text)?.[1] ?? "");

const escapeRegExp = (text: string) => text.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

export class PerpsOrderPage extends WebViewAppPage {
  protected readonly webviewIdentifier = "perps";

  private readonly orderWidgetTestId = "desktop-order-widget";
  private readonly amountInputTestId = "desktop-amount-input";
  private readonly leverageButtonTestId = "configure-leverage-button";
  private readonly confirmLeverageTestId = "confirm-leverage-button";
  private readonly openPositionButtonTestId = "open-position-button";
  private readonly statusDialogTitleTestId = "status-dialog-title";
  private readonly statusDialogContinueTestId = "status-dialog-primary-button";
  private readonly closePositionButtonTestId = "close-position-button";
  private readonly closeConfirmButtonTestId = "close-position-confirm-button";
  private readonly closeRecapCtaTestId = "close-position-recap-dialog-cta";
  private readonly closeMaxTestId = "quick-amount-picker-Max";
  private readonly autoCloseSubmitTestId = "desktop-order-configure-auto-close-submit";
  private readonly configureSubmitTestId = "configure-order-submit-button";

  @step("Open the first market without a position")
  async openFirstMarketWithoutPosition(market: PerpsMarketGroup, positions: ProviderPosition[]) {
    const webview = await this.getWebView();
    const markets = webview.getByTestId(market.marketTestId);
    await expect(markets.first()).toBeVisible();
    const listed = await markets.evaluateAll(items => items.map(item => item.dataset.testid ?? ""));
    const busy = new Set(positions.map(({ symbol }) => `market-item-${symbol}`));
    const free = listed.find(testId => !busy.has(testId));
    if (!free) throw new Error(`Every listed ${market.label} market already holds a position`);
    await webview.getByTestId(free).click();
    await expect(
      webview.getByTestId(this.orderWidgetTestId),
      "The order form is hidden although the provider reports no position here",
    ).toBeVisible();
  }

  @step("Select the $0 order side")
  async selectSide(side: PerpsOrderSide) {
    const webview = await this.getWebView();
    await webview.getByTestId(`order-tab-${side}`).click();
  }

  @step("Enter the order margin of $0 USD")
  async enterMargin(amountUsd: number) {
    const webview = await this.getWebView();
    const orderWidget = webview.getByTestId(this.orderWidgetTestId);
    await orderWidget.getByTestId(this.amountInputTestId).fill(String(amountUsd));
    await expect(orderWidget.getByTestId(this.openPositionButtonTestId)).toBeEnabled();
  }

  @step("Set the order leverage to $0")
  async setLeverage(leverage: number) {
    const webview = await this.getWebView();
    await webview.getByTestId(this.leverageButtonTestId).click();
    await webview.getByTestId(`slider-${leverage}`).click();
    await webview.getByTestId(this.confirmLeverageTestId).click();
  }

  @step("Verify the order leverage is $0")
  async expectLeverage(leverage: number) {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(this.leverageButtonTestId)).toContainText(`${leverage}x`);
  }

  @step("Set the Take profit and Stop loss of a $0 order")
  async setAutoClose(side: PerpsOrderSide) {
    const webview = await this.getWebView();
    const offsets = AUTO_CLOSE_OFFSETS[side];
    await webview.getByRole("button", { name: "Autoclose" }).click();
    await this.pickAutoCloseOffset("Take profit", offsets.takeProfit);
    await this.pickAutoCloseOffset("Stop loss", offsets.stopLoss);
    await webview.getByTestId(this.autoCloseSubmitTestId).click();
  }

  @step("Verify the order shows the Take profit and Stop loss")
  async expectAutoCloseSet() {
    const webview = await this.getWebView();
    const orderWidget = webview.getByTestId(this.orderWidgetTestId);
    await expect(orderWidget.getByRole("button", { name: /^Autoclose/ })).toContainText(
      autoCloseSummary,
    );
  }

  @step("Click Open position")
  async clickOpenPosition() {
    const webview = await this.getWebView();
    await webview
      .getByTestId(this.orderWidgetTestId)
      .getByTestId(this.openPositionButtonTestId)
      .click();
  }

  @step("Verify the order was placed")
  async expectOrderPlaced() {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(this.statusDialogTitleTestId)).toBeVisible({
      timeout: TIMEOUT.xxlarge,
    });
  }

  @step("Continue after the order was placed")
  async clickContinueAfterOrderPlaced() {
    const webview = await this.getWebView();
    await webview.getByTestId(this.statusDialogContinueTestId).click();
  }

  @step("Verify the opened position")
  async expectOpenedPosition({
    side,
    leverage,
    marginUsd,
  }: {
    side: PerpsOrderSide;
    leverage: number;
    marginUsd: number;
  }) {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(this.closePositionButtonTestId)).toHaveText(
      new RegExp(`^Close ${side}$`, "i"),
      { timeout: TIMEOUT.xxlarge },
    );
    await expect(webview.getByRole("button", { name: /^Leverage/ })).toContainText(`${leverage}x`);
    const margin = webview.getByRole("button", { name: /^Margin/ });
    const shownMargin = async () => readUsdAmount(await margin.innerText());
    // The exchange rounds the size down, so the margin can fall below the request.
    await expect.poll(shownMargin).toBeGreaterThanOrEqual(MIN_ORDER_NOTIONAL_USD / leverage);
    await expect.poll(shownMargin).toBeLessThanOrEqual(marginUsd + MARGIN_TOLERANCE_USD);
    await this.expectPositionAutoClose(side);
  }

  @step("Verify the position is closed")
  async expectPositionClosed() {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(this.closePositionButtonTestId)).toBeHidden({
      timeout: TIMEOUT.xxlarge,
    });
  }

  @step("Start closing the full position")
  async startClosePosition() {
    const webview = await this.getWebView();
    await webview.getByTestId(this.closePositionButtonTestId).click();
    await webview.getByTestId(this.closeMaxTestId).click();
    await webview.getByTestId(this.closeConfirmButtonTestId).click();
  }

  @step("Verify the position close recap")
  async expectCloseRecap() {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(this.closeRecapCtaTestId)).toBeVisible({
      timeout: TIMEOUT.xxlarge,
    });
  }

  @step("Click Trade again on the position close recap")
  async clickTradeAgainOnCloseRecap() {
    const webview = await this.getWebView();
    await webview.getByTestId(this.closeRecapCtaTestId).click();
  }

  @step("Read the open positions of every provider")
  async getProviderPositions(address: string): Promise<ProviderPosition[]> {
    const webview = await this.getWebView();
    const positions: unknown = await webview.evaluate(async walletAddress => {
      const fetchJson = async (url: string, init?: RequestInit) => {
        const response = await fetch(url, init);
        if (!response.ok) throw new Error(`The Perps provider answered ${response.status}`);
        return response.json();
      };
      const providers: { id: string }[] = await fetchJson("/proxy/perps/v1/providers");
      const perProvider = await Promise.all(
        providers.map(async ({ id: providerId }) => {
          const open: { marketId: string }[] = await fetchJson("/proxy/perps/v1/positions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: walletAddress, providerId }),
          });
          return Promise.all(
            open.map(async ({ marketId }) => {
              const market = await fetchJson(
                `/proxy/perps/v1/markets/${encodeURIComponent(marketId)}`,
              );
              return { marketId, symbol: market.baseAsset.symbol };
            }),
          );
        }),
      );
      return perProvider.flat();
    }, address);
    if (!Array.isArray(positions))
      throw new TypeError("The Perps provider returned no position list");
    return positions.map(position => {
      if (typeof position?.marketId !== "string" || typeof position?.symbol !== "string") {
        throw new TypeError("A provider position has no market id or symbol");
      }
      return { marketId: position.marketId, symbol: position.symbol };
    });
  }

  @step("Verify the provider reports no new position")
  async expectNoNewProviderPositions(address: string, knownMarketIds: string[]) {
    const known = new Set(knownMarketIds);
    await expect
      .poll(
        async () =>
          (await this.getProviderPositions(address)).filter(({ marketId }) => !known.has(marketId))
            .length,
        { timeout: TIMEOUT.xxlarge, intervals: [INTERVAL.medium] },
      )
      .toBe(0);
  }

  @step("Open the position of the market from the positions list")
  async openPositionFromList(position: ProviderPosition) {
    const webview = await this.getWebView();
    const row = this.positionRow(webview, position);
    await expect(
      row,
      `The provider reports a position on ${position.marketId} that the positions list does not show`,
    ).toBeVisible({ timeout: TIMEOUT.xxlarge });
    await row.click();
  }

  @step("Verify the positions list no longer shows the market")
  async expectPositionRowHidden(position: ProviderPosition) {
    const webview = await this.getWebView();
    await expect(this.positionRow(webview, position)).toBeHidden({ timeout: TIMEOUT.xxlarge });
  }

  // The list shows the symbol without its dex prefix, then the side and leverage.
  private positionRow(webview: Page, { symbol: providerSymbol }: ProviderPosition) {
    const symbol = escapeRegExp(providerSymbol.replace(/^.*:/, ""));
    return webview.getByRole("button", {
      name: new RegExp(String.raw`(?<![\w-])${symbol}\s+(Long|Short) \d+x`),
    });
  }

  private async expectPositionAutoClose(side: PerpsOrderSide) {
    const webview = await this.getWebView();
    const autoClose = webview.getByRole("button", { name: /^Autoclose/ });
    await expect(autoClose).toContainText(autoCloseSummary);
    const [, takeProfit, stopLoss] = autoCloseSummary.exec(await autoClose.innerText()) ?? [];
    const offsets = AUTO_CLOSE_OFFSETS[side];
    const expectedRatio = offsetToFactor(offsets.takeProfit) / offsetToFactor(offsets.stopLoss);
    expect(parseAmount(takeProfit ?? "") / parseAmount(stopLoss ?? "")).toBeCloseTo(
      expectedRatio,
      2,
    );
  }

  private async pickAutoCloseOffset(title: "Take profit" | "Stop loss", offset: string) {
    const webview = await this.getWebView();
    await webview.getByText(title, { exact: true }).click();
    await webview.getByTestId(`quick-amount-picker-${offset}`).click();
    await webview.getByTestId(this.configureSubmitTestId).click();
  }
}
