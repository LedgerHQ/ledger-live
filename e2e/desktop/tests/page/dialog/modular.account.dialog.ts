import { step } from "../../misc/reporters/step";
import { AccountType, getParentAccountName } from "@ledgerhq/live-common/e2e/enum/Account";
import { Dialog } from "../../component/dialog.component";

export class ModularAccountDialog extends Dialog {
  private dialogContent = this.page.getByTestId("modular-dialog-screen-ACCOUNT_SELECTION");
  private accountRowByName = (accountName: string) =>
    this.page.locator("[data-testid^='account-row-']").filter({ hasText: accountName });
  private addNewExistingAccountButton = this.page.getByRole("button", {
    name: "Add account",
  });

  @step("Validate modular account dialog is visible")
  async isModularAccountDialogVisible(): Promise<boolean> {
    try {
      await this.dialogContent.waitFor({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  @step("Select account by name")
  async selectAccountByName(account: AccountType) {
    const isAccountDialogVisible = await this.isModularAccountDialogVisible();
    if (isAccountDialogVisible) {
      await this.accountRowByName(getParentAccountName(account)).first().click();
    }
  }

  @step("Click on add and existing account button")
  async clickOnAddAndExistingAccountButton() {
    if (await this.isModularAccountDialogVisible()) {
      await this.addNewExistingAccountButton.click();
    }
  }
}
