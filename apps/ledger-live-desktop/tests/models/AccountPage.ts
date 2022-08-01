import { Page, Locator } from '@playwright/test';

export class AccountPage {
  readonly page: Page;
  readonly buttonsGroup: Locator;
  readonly settingsButton: Locator;
  readonly buttonSend: Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.buttonsGroup = page.locator('data-test-id=account-buttons-group');
    this.settingsButton = page.locator('data-test-id=account-settings-button');
    this.buttonSend = page.locator(`text=Send`);
  }

  async clickBtnSend() {
    await this.buttonSend.click();
  }
}
