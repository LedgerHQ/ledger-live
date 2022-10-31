import { Page, Locator } from "@playwright/test";
import { syncBuiltinESMExports } from "module";

export class AccountsPage {
  readonly page: Page;
  readonly addAccountButton: Locator;
  readonly accountRow: Function;

  constructor(page: Page) {
    this.page = page;
    this.addAccountButton = page.locator("data-test-id=accounts-add-account-button");
    this.accountRow = (name: string): Locator => page.locator(`text=${name}`);
  }

  async openAddAccountModal() {
    await this.addAccountButton.click();
  }

  async goToAccount(name: string) {
    await this.accountRow(name).click();
  }
}
