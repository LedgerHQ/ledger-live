import { Page } from "@playwright/test";

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

  async waitForPageDomContentLoadedState() {
    return await this.page.waitForLoadState("domcontentloaded");
  }

  async waitForPageLoadState() {
    return await this.page.waitForLoadState("load");
  }
}

export abstract class AppPage extends Component {}
