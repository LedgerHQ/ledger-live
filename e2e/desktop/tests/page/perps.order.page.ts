import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { WebViewAppPage } from "tests/page/webViewApp.page";
import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";

export type PerpsOrderSide = "long" | "short";

type AutoCloseOffsets = { takeProfit: string; stopLoss: string };

// Quick-option labels of the live app, by side.
const AUTO_CLOSE_OFFSETS = {
  long: { takeProfit: "+10%", stopLoss: "-5%" },
  short: { takeProfit: "-5%", stopLoss: "+5%" },
} satisfies Record<PerpsOrderSide, AutoCloseOffsets>;

const autoCloseSummary = /Take profit \$([\d,.]+), Stop loss \$([\d,.]+)/;

const offsetToFactor = (offset: string) => 1 + Number.parseFloat(offset) / 100;

const toNumber = (text: string) => Number.parseFloat(text.replaceAll(/[^\d.]/g, ""));

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

  private marketOpened = false;

  @step("Open the first HIP-3 market")
  async openFirstHip3Market() {
    const webview = await this.getWebView();
    await webview
      .getByTestId(/^market-item-xyz:/)
      .first()
      .click();
    this.marketOpened = true;
    await expect(
      webview.getByTestId(this.orderWidgetTestId),
      "A position already open on this market hides the order form: close it first",
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
    await expect(orderWidget.getByText("Take profit")).toBeVisible();
    await expect(orderWidget.getByText("Stop loss")).toBeVisible();
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

  @step("Verify the opened $0 position")
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
    await expect.poll(async () => toNumber(await margin.innerText())).toBeCloseTo(marginUsd, 0);
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

  // False when the test never opened a market, so teardown has nothing to look for.
  @step("Check whether the opened market holds a position")
  async hasPositionOnOpenedMarket(): Promise<boolean> {
    if (!this.marketOpened) return false;
    const webview = await this.getWebView();
    const closeButton = webview.getByTestId(this.closePositionButtonTestId);
    await expect(webview.getByTestId(this.orderWidgetTestId).or(closeButton)).toBeVisible();
    return closeButton.isVisible();
  }

  private async expectPositionAutoClose(side: PerpsOrderSide) {
    const webview = await this.getWebView();
    const autoClose = webview.getByRole("button", { name: /^Autoclose/ });
    await expect(autoClose).toContainText(autoCloseSummary);
    const [, takeProfit, stopLoss] = autoCloseSummary.exec(await autoClose.innerText()) ?? [];
    const offsets = AUTO_CLOSE_OFFSETS[side];
    const expectedRatio = offsetToFactor(offsets.takeProfit) / offsetToFactor(offsets.stopLoss);
    expect(toNumber(takeProfit ?? "") / toNumber(stopLoss ?? "")).toBeCloseTo(expectedRatio, 1);
  }

  private async pickAutoCloseOffset(title: "Take profit" | "Stop loss", offset: string) {
    const webview = await this.getWebView();
    await webview.getByText(title, { exact: true }).click();
    await webview.getByTestId(`quick-amount-picker-${offset}`).click();
    await webview.getByTestId(this.configureSubmitTestId).click();
  }
}
