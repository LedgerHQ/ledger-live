import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";

export class AccountsPage extends AppPage {
  private addAccountButton = this.page.getByTestId("accounts-add-account-button");
  private accountComponent = (accountName: string) =>
    this.page.getByTestId(`account-component-${accountName}`);
  private firstAccount = this.page.locator(".accounts-account-row-item").locator("div").first();
  // Accounts context menu
  private contextMenuEdit = this.page.getByTestId("accounts-context-menu-edit");
  private settingsDeleteButton = this.page.getByTestId("account-settings-delete-button");
  private settingsConfirmButton = this.page.getByTestId("modal-confirm-button");
  private accountListNumber = this.page.locator(`[data-test-id^="account-component-"]`);

  async openAddAccountModal() {
    await this.addAccountButton.click();
  }

  @step("Open Account $0")
  async navigateToAccountByName(accountName: string) {
    await this.accountComponent(accountName).click();
  }

  @step("Check $0 account was deleted ")
  async expectAccountAbsence(accountName: string) {
    expect(this.firstAccount).not.toBe(accountName);
    expect(await this.getAccountsName()).not.toContain(accountName);
  }

  /**
   * Delete first account from accounts list
   */
  async deleteFirstAccount() {
    await this.firstAccount.click({ button: "right" });
    await this.contextMenuEdit.click();
    await this.settingsDeleteButton.click();
    await this.settingsConfirmButton.click();
  }

  async countAccounts(): Promise<number> {
    return await this.page.locator(".accounts-account-row-item-content").count();
  }

  async getAccountsName() {
    const accountElements = await this.accountListNumber.all();
    const accountNames = [];
    for (const element of accountElements) {
      let accountName = await element.getAttribute("data-test-id");
      if (accountName) {
        accountName = accountName.replace("account-component-", "");
        accountNames.push(accountName);
      }
    }
    return accountNames;
  }
}
