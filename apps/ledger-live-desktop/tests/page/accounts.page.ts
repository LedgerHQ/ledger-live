import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";

const CRYPTO_ACCOUNT_ROW_PREFIX = "crypto-account-row-";

export class AccountsPage extends AppPage {
  private addAccountButton = this.page.getByTestId("crypto-add-address-button");
  private readonly accountRows = this.page.locator(`[data-testid^="${CRYPTO_ACCOUNT_ROW_PREFIX}"]`);
  private firstAccount = this.accountRows.first();

  private readonly getSanitizedAccountName = (accountName: string) =>
    accountName.replaceAll(/\s+/g, "-");

  private getAccountRow(accountName: string) {
    return this.page.getByTestId(
      `${CRYPTO_ACCOUNT_ROW_PREFIX}${this.getSanitizedAccountName(accountName)}`,
    );
  }
  // Accounts context menu
  private contextMenuEdit = this.page.getByTestId("accounts-context-menu-edit");
  private settingsDeleteButton = this.page.getByTestId("account-settings-delete-button");
  private settingsConfirmButton = this.page.getByTestId("modal-confirm-button");

  async openAddAccountModal() {
    await this.addAccountButton.click();
  }

  @step("Open Account $0")
  async navigateToAccountByName(accountName: string) {
    await this.getAccountRow(accountName).click();
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
    return this.accountRows.count();
  }
}
