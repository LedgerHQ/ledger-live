import { Page, Locator } from '@playwright/test';
import { syncBuiltinESMExports } from 'module';

export class AccountsPage {
  readonly page: Page;
  readonly addAccountButton: Locator;
  readonly accountTile : Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.addAccountButton = page.locator('data-test-id=accounts-add-account-button');
    this.accountTile = page.locator(`text=Cardano 1`); //(accountName: string) : Locator => 
  }

  async openAddAccountModal() {
    await this.addAccountButton.click();
  }

  async clickAccountTile() {
    await this.accountTile.click();
  }
}
