import { Page, expect } from "@playwright/test";
import { step } from "../misc/reporters/step";
import { AppPage } from "./abstractClasses";

export abstract class WebViewAppPage extends AppPage {
  public _webviewPage?: Page;
  public webviewUrlHistory: string[] = [];
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

    if (!(webview as any)._ledgerUrlListenerAttached) {
      webview.on("framenavigated", frame => {
        if (frame === webview.mainFrame()) {
          this.webviewUrlHistory.push(frame.url());
        }
      });
      (webview as any)._ledgerUrlListenerAttached = true;
    }

    this._webviewPage = webview;
    return webview;
  }

  @step("Wait for newWebView to be available")
  protected async waitForNewWindow() {
    if (!this.electronApp) {
      throw new Error("No electronApp instance");
    }
    const newWindow = await this.electronApp.waitForEvent("window");
    await newWindow.waitForLoadState();
    return newWindow;
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

  @step("Scroll to element in WebView")
  protected async scrollToElement(testId: string) {
    const webview = await this.getWebView();
    await webview.getByTestId(testId).scrollIntoViewIfNeeded();
  }

  @step("Get element in WebView by testId: $0")
  protected async getWebViewElementByTestId(testId: string) {
    const webview = await this.getWebView();
    return webview.getByTestId(testId);
  }

  @step("Expect text to be visible in WebView")
  protected async expectTextToBeVisible(text: string) {
    const webview = await this.getWebView();
    await expect(webview.getByText(text, { exact: true })).toBeVisible();
  }

  @step("Click text in WebView")
  protected async clickElementByText(text: string) {
    const webview = await this.getWebView();
    await webview.getByText(text, { exact: true }).click();
  }

  @step("Check if text is visible in WebView")
  protected async isTextVisible(text: string): Promise<boolean> {
    const webview = await this.getWebView();
    const element = webview.getByText(text, { exact: true });
    try {
      await expect(element).toBeVisible({ timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }
}
