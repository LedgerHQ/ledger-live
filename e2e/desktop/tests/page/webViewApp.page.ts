import { Page, expect } from "@playwright/test";
import { step } from "../misc/reporters/step";
import { AppPage } from "./abstractClasses";

export abstract class WebViewAppPage extends AppPage {
  private _webviewPage?: Page;
  protected defaultWebViewTimeout = 60_000;

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
      webview = await this.electronApp.waitForEvent("window", {
        timeout: this.defaultWebViewTimeout,
      });
    }

    await webview.waitForLoadState("domcontentloaded", {
      timeout: this.defaultWebViewTimeout,
    });
    webview.setDefaultTimeout(this.defaultWebViewTimeout);
    this._webviewPage = webview;
    return webview;
  }

  @step("Verify element is visible in WebView")
  protected async verifyElementIsVisible(testId: string) {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(testId)).toBeVisible();
  }

  @step("Verify element is not visible in WebView")
  protected async verifyElementIsNotVisible(testId: string) {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(testId)).not.toBeVisible();
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

  @step("Set value in WebView element")
  protected async setValue(testId: string, value: string) {
    const webview = await this.getWebView();
    const input = webview.getByTestId(testId);
    await input.click();
    await input.fill(value);
  }

  @step("Verify element is not enabled in WebView")
  protected async verifyElementIsNotEnabled(testId: string) {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(testId)).not.toBeEnabled();
  }

  @step("Verify element is enabled in WebView")
  protected async verifyElementIsEnabled(testId: string) {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(testId)).toBeEnabled();
  }

  @step("Click element in WebView")
  protected async clickElement(testId: string) {
    const webview = await this.getWebView();
    await webview.getByTestId(testId).click();
  }

  @step("Get WebView URL")
  protected async getUrl() {
    const webview = await this.getWebView();
    return webview.url();
  }

  @step("Get element in WebView by testId: $0")
  protected async getWebViewElementByTestId(testId: string) {
    const webview = await this.getWebView();
    return webview.getByTestId(testId);
  }
}
