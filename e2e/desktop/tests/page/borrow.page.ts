import { expect, type Page } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { WebViewAppPage } from "./webViewApp.page";

export class BorrowPage extends WebViewAppPage {
  protected readonly webviewIdentifier = "borrow";

  private readonly borrowRoutePattern = /\/borrow/;
  private readonly simulateLoanRoutePattern = /\/loan\/simulate-loan/;
  private readonly introModalTitle = "Introducing Crypto Loan";

  private introModal(webview: Page) {
    return webview.getByRole("dialog").filter({
      has: webview.getByRole("heading", { name: this.introModalTitle }),
    });
  }

  private introModalHeading(webview: Page) {
    return this.introModal(webview).getByRole("heading", { name: this.introModalTitle });
  }

  @step("Go and wait for Borrow app to be ready")
  async goAndWaitForBorrowToBeReady(entryFn: () => Promise<void>) {
    this._webviewPage = undefined;
    await entryFn();
    await expect(this.page).toHaveURL(this.borrowRoutePattern);
    const webview = await this.getWebView();
    await expect(webview).toHaveURL(this.simulateLoanRoutePattern);
  }

  @step("Verify Introducing Crypto Loan modal is visible")
  async verifyIntroModalVisible() {
    const webview = await this.getWebView();
    await expect(this.introModal(webview)).toBeVisible();
    await expect(this.introModalHeading(webview)).toBeVisible();
  }
}
