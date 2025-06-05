import { Page, expect } from "@playwright/test";
import { step } from "../misc/reporters/step";
import { AppPage } from "./abstractClasses";

export abstract class WebViewAppPage extends AppPage {
  private _webviewPage?: Page;

  @step("Wait for WebView to be available")
  protected async getWebView(): Promise<Page> {
    if (this._webviewPage) {
      return this._webviewPage;
    }
    if (!this.electronApp) {
      throw new Error("No ElectronApplication instance available");
    }

    const all = this.electronApp.windows();
    let webview: Page;
    if (all.length > 1) {
      webview = all[1];
    } else {
      webview = await this.electronApp.waitForEvent("window");
    }

    await webview.waitForLoadState();
    this._webviewPage = webview;
    return webview;
  }

  @step("Verify element is visible in WebView")
  protected async verifyElementIsVisible(testId: string) {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(testId)).toBeVisible();
  }

  @step("Verify text is displayed in WebView element")
  protected async verifyElementText(testId: string, expected: string) {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(testId)).toContainText(expected);
  }

  @step("Verify element is selected in WebView")
  protected async verifyElementIsSelected(testId: string) {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(testId)).toHaveAttribute("data-active", "true");
  }
}
