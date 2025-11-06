import { Page, expect, ElectronApplication } from "@playwright/test";
import { step } from "tests/misc/reporters/step";

export abstract class PageHolder {
  constructor(
    protected page: Page,
    protected readonly electronApp?: ElectronApplication,
  ) {}

  getPage() {
    return this.page;
  }
}

export abstract class Component extends PageHolder {
  protected dropdownOptions = this.page.locator("div.select__option");
  protected dropdownOptionsList = this.page.locator("div.select-options-list");
  protected optionWithText = (text: string) =>
    this.page.locator(`//*[contains(text(),"${text}")]`).first();
  protected dropdownSelectedValue = this.page.locator(".select__single-value span").first();
  protected optionWithTextAndFollowingText = (text: string, followingText: string) =>
    this.page
      .locator(
        `//*[contains(text(),"${text}")]/following::span[contains(text(),"${followingText}")]`,
      )
      .first();
  protected loadingSpinner = this.page.getByTestId("loading-spinner");
  private getAppAndVersionError = this.page.locator("#error-GetAppAndVersionUnsupportedFormat");
  private retryButton = this.page.getByRole("button", { name: "Retry" });

  recoverFromGetAppAndVersionError(interval: number = 200) {
    const handle = setInterval(async () => {
      try {
        if (await this.getAppAndVersionError.isVisible({ timeout: 50 }).catch(() => false)) {
          if (await this.retryButton.isVisible({ timeout: 50 }).catch(() => false)) {
            await this.retryButton.click();
          }
        }
      } catch {
        // ignore
      }
    }, interval);

    return () => clearInterval(handle);
  }

  @step("Waiting for app to fully load")
  async waitForPageDomContentLoadedState() {
    return await this.page.waitForLoadState("domcontentloaded");
  }

  @step("Check URL contains all values")
  async expectUrlToContainAll(url: string, values: string[]) {
    if (!url) {
      throw new Error("URL is null or undefined");
    }
    const normalizedUrl = url.toLowerCase();
    for (const value of values) {
      expect(normalizedUrl).toContain(value.toLowerCase());
    }
  }
}

export abstract class AppPage extends Component {}
