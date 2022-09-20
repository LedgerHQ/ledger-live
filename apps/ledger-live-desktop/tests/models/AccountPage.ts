import { Page, Locator } from '@playwright/test';

export class AccountPage {
  readonly page: Page;
  readonly buttonsGroup: Locator;
  readonly settingsButton: Locator;
  readonly removeButton: Locator;
  readonly firstAccount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.buttonsGroup = page.locator('data-test-id=account-buttons-group');
    this.settingsButton = page.locator('data-test-id=account-settings-button');
    this.removeButton = page.locator('data-test-id=account-settings-delete');
    this.firstAccount = page.locator('.accounts-account-row-item-content').first();
  }

  async clickFirstAccount() {
    await this.firstAccount.click();
  }
}
