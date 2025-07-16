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

  async openAddAccountModal() {
    await this.addAccountButton.click();
  }

  @step("Open Account $0")
  async navigateToAccountByName(accountName: string) {
    await this.accountComponent(accountName).click();
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
}
