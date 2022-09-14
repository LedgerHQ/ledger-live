import { Page, Locator } from '@playwright/test';

export class AccountsPage {
  readonly page: Page;
  readonly addAccountButton: Locator;
  readonly accountRow: Function;
  
  constructor(page: Page) {
    this.page = page;
    this.addAccountButton = page.locator('data-test-id=accounts-add-account-button');
    this.accountRow = (name: string) : Locator => page.locator(`.${name}`);
  }

  async openAddAccountModal() {
    await this.addAccountButton.click();
  }

  /**
   * account name could be caught trought class name
   * example: "Ethereum 1" -> "ethereum-1"
   */
  async goToAccount(name: string) {
    await this.accountRow(name).click();
  }
}
