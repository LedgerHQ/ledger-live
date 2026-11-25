import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { WebViewAppPage } from "tests/page/webViewApp.page";
import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";

export type PerpsOrderSide = "long" | "short";

type AutoCloseOffsets = { takeProfit: string; stopLoss: string };

// Quick-option labels of the live app, by side.
export const AUTO_CLOSE_OFFSETS: Record<PerpsOrderSide, AutoCloseOffsets> = {
  long: { takeProfit: "+10%", stopLoss: "-5%" },
  short: { takeProfit: "-5%", stopLoss: "+5%" },
};

export class PerpsOrderPage extends WebViewAppPage {
  protected readonly webviewIdentifier = "perps";

  private readonly orderWidgetTestId = "desktop-order-widget";
  private readonly amountInputTestId = "desktop-amount-input";
  private readonly openPositionButtonTestId = "open-position-button";
  private readonly statusDialogTitleTestId = "status-dialog-title";
  private readonly statusDialogContinueTestId = "status-dialog-primary-button";
  private readonly closePositionButtonTestId = "close-position-button";
  private readonly closeConfirmButtonTestId = "close-position-confirm-button";
  private readonly closeRecapCtaTestId = "close-position-recap-dialog-cta";
  private readonly closeMaxTestId = "quick-amount-picker-Max";
  private readonly autoCloseSubmitTestId = "desktop-order-configure-auto-close-submit";
  private readonly configureSubmitTestId = "configure-order-submit-button";

  @step("Open the first HIP-3 market")
  async openFirstHip3Market() {
    const webview = await this.getWebView();
    await webview
      .getByTestId(/^market-item-xyz:/)
      .first()
      .click();
    await expect(webview.getByTestId(this.orderWidgetTestId)).toBeVisible();
  }

  @step("Select the order side")
  async selectSide(side: PerpsOrderSide) {
    const webview = await this.getWebView();
    await webview.getByTestId(`order-tab-${side}`).click();
  }

  @step("Enter the order margin in USD")
  async enterMargin(amountUsd: number) {
    const webview = await this.getWebView();
    const orderWidget = webview.getByTestId(this.orderWidgetTestId);
    await orderWidget.getByTestId(this.amountInputTestId).fill(String(amountUsd));
    await expect(orderWidget.getByTestId(this.openPositionButtonTestId)).toBeEnabled();
  }

  @step("Set the order leverage")
  async setLeverage(leverage: number) {
    const webview = await this.getWebView();
    await webview.getByTestId("configure-leverage-button").click();
    await webview.getByTestId(`slider-${leverage}`).click();
    await webview.getByTestId("confirm-leverage-button").click();
  }

  @step("Set the Take profit and Stop loss of the order")
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
    await webview.getByTestId(this.statusDialogContinueTestId).click();
    await this.expectPositionOpen();
  }

  @step("Verify the position is open")
  async expectPositionOpen() {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(this.closePositionButtonTestId)).toBeVisible({
      timeout: TIMEOUT.xxlarge,
    });
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
    const recapCta = webview.getByTestId(this.closeRecapCtaTestId);
    await expect(recapCta).toBeVisible({ timeout: TIMEOUT.xxlarge });
    await recapCta.click();
  }

  @step("Check whether a position is open")
  async hasOpenPosition(): Promise<boolean> {
    const webview = await this.getWebView();
    return webview.getByTestId(this.closePositionButtonTestId).isVisible();
  }

  private async pickAutoCloseOffset(title: "Take profit" | "Stop loss", offset: string) {
    const webview = await this.getWebView();
    await webview.getByText(title, { exact: true }).click();
    await webview.getByTestId(`quick-amount-picker-${offset}`).click();
    await webview.getByTestId(this.configureSubmitTestId).click();
  }
}
