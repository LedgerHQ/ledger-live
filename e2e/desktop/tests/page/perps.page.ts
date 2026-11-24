import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { WebViewAppPage } from "tests/page/webViewApp.page";
import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";

export class PerpsPage extends WebViewAppPage {
  protected readonly webviewIdentifier = "perps";

  private readonly depositButtonTestId = "deposit-button";
  private readonly sidebarBalanceTestId = "desktop-sidebar-balance";
  // Any amount above zero, e.g. "$59.45".
  private readonly nonZeroAmount = /\$(?!0\.00)[\d,]*\d\.\d{2}/;

  @step("Verify the Perps home shows the funded account balance")
  async expectFundedAccountBalance() {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(this.sidebarBalanceTestId)).toContainText(this.nonZeroAmount, {
      timeout: TIMEOUT.xxlarge,
    });
  }

  @step("Click Deposit in the Perps live app")
  async clickDeposit() {
    const webview = await this.getWebView();
    await webview.getByTestId(this.depositButtonTestId).click();
  }
}
