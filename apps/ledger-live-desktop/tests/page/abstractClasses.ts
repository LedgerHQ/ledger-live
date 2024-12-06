import { Page } from "@playwright/test";
import { step } from "tests/misc/reporters/step";

export abstract class PageHolder {
  constructor(protected page: Page) {}
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

  async waitForPageDomContentLoadedState() {
    return await this.page.waitForLoadState("domcontentloaded");
  }

  async waitForPageLoadState() {
    return await this.page.waitForLoadState("load");
  }

  @step("Wait for network calls to be completed")
  async waitForPageNetworkIdleState() {
    return await this.page.waitForLoadState("networkidle");
  }
}

export abstract class AppPage extends Component {}
