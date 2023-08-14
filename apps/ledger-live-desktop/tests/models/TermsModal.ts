import { Page, Locator } from "@playwright/test";

export class TermsModal {
  readonly page: Page;
  readonly termsModal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.termsModal = page.locator('[data-test-id="terms-update-popup"]');
  }

  async waitToBeVisible() {
    await this.termsModal.waitFor({ state: "visible" });
  }
}
