import { Page, Locator } from "@playwright/test";

export class AccountsPage {
  readonly page: Page;
  readonly addAccountButton: Locator;
  readonly accountComponent: (accountName: string) => Locator;

  constructor(page: Page) {
    this.page = page;
    this.addAccountButton = page.locator("data-test-id=accounts-add-account-button");
    this.accountComponent = (accountName: string) =>
      page.locator(`data-test-id=account-component-${accountName}`);
  }

  async openAddAccountModal() {
    await this.addAccountButton.click();
  }

  async navigateToAccountByName(accountName: string) {
    await this.accountComponent(accountName).click();
  }
}
