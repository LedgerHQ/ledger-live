import { Page, expect, test } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";

export abstract class WebViewAppPage extends AppPage {
  public _webviewPage?: Page;
  public webviewUrlHistory: string[] = [];

  protected abstract readonly webviewIdentifier: string;
  protected defaultWebViewTimeout = 60_000;

  /** The first Electron window whose title matches this page's webview identifier. */
  private async findWebviewWindow(): Promise<Page | undefined> {
    const identifier = this.webviewIdentifier.toLowerCase();
    for (const window of this.electronApp?.windows() ?? []) {
      try {
        const title = await window.title();
        if (title.toLowerCase().includes(identifier)) return window;
      } catch {
        // The webview can detach while its title is read; the next poll re-lists the windows.
      }
    }
    return undefined;
  }

  @step("Wait for WebView to be available")
  protected async getWebView(timeout = 60_000): Promise<Page> {
    if (this._webviewPage) {
      if (!this._webviewPage.isClosed()) {
        return this._webviewPage;
      }
      this._webviewPage = undefined;
    }
    if (!this.electronApp) {
      test.abort("No ElectronApplication instance available");
    }

    const startTime = Date.now();
    let webview: Page | undefined;

    // The target webview is not always available immediately: a different one may already
    // be open, or it may still be loading into the view.
    await expect
      .poll(
        async () => {
          webview = await this.findWebviewWindow();
          return webview !== undefined;
        },
        {
          timeout,
          intervals: [500],
          message: `WebView with identifier "${this.webviewIdentifier}" not found after ${timeout}ms`,
        },
      )
      .toBe(true);

    if (!webview) {
      // Unreachable: expect.poll only resolves once the callback returned true.
      test.abort(`WebView "${this.webviewIdentifier}" was matched but not captured.`);
    }
    // Bind to a const so the narrowing survives into the framenavigated closure below.
    const resolved = webview;

    const remainingTimeout = Math.max(timeout - (Date.now() - startTime), 0);
    await resolved.waitForLoadState("domcontentloaded", {
      timeout: remainingTimeout,
    });
    resolved.setDefaultTimeout(this.defaultWebViewTimeout);

    if (!(resolved as any)._ledgerUrlListenerAttached) {
      resolved.on("framenavigated", frame => {
        if (frame === resolved.mainFrame()) {
          this.webviewUrlHistory.push(frame.url());
        }
      });
      (resolved as any)._ledgerUrlListenerAttached = true;
    }

    this._webviewPage = resolved;
    return resolved;
  }

  @step("Wait for newWebView to be available")
  protected async waitForNewWindow() {
    if (!this.electronApp) {
      test.abort("No electronApp instance");
    }
    const newWindow = await this.electronApp.waitForEvent("window");
    await newWindow.waitForLoadState();
    return newWindow;
  }

  @step("Verify element is visible in WebView")
  protected async verifyElementIsVisible(testId: string, timeout?: number) {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(testId)).toBeVisible(timeout ? { timeout } : undefined);
  }

  @step("Verify element is not visible in WebView")
  protected async verifyElementIsNotVisible(testId: string) {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(testId)).not.toBeVisible();
  }

  @step("Verify text '$1' is displayed in WebView element")
  protected async verifyElementText(testId: string, expected: string) {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(testId)).toContainText(expected);
  }

  @step("Verify text '$1' is not displayed in WebView element")
  protected async verifyElementTextNotContains(testId: string, notExpected: string) {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(testId)).toBeVisible();
    await expect(webview.getByTestId(testId)).not.toContainText(notExpected, { ignoreCase: true });
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

  @step("Get texts by CSS selector: $0")
  protected async getTextsByCssSelector(cssSelector: string): Promise<string[]> {
    const webview = await this.getWebView();
    await expect(webview.locator(cssSelector).first()).toBeVisible();
    return webview.locator(cssSelector).allTextContents();
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
