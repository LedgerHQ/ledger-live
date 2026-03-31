import { step } from "../../misc/reporters/step";
import { AccountType, getParentAccountName } from "@ledgerhq/live-common/e2e/enum/Account";
import { Dialog } from "../../component/dialog.component";
import { expect } from "@playwright/test";

export class ModularAccountDialog extends Dialog {
  private dialogContent = this.page.getByTestId("modular-dialog-screen-ACCOUNT_SELECTION");
  private accountRowByName = (accountName: string) =>
    this.page.locator("[data-testid^='account-row-']").filter({ hasText: accountName });
  private addNewExistingAccountButton = this.page.getByRole("button", {
    name: "Add account",
  });

  @step("Wait for dialog to be visible")
  async waitForDialogToBeVisible() {
    await expect(this.content).toBeVisible();
    await this.dialogOverlay.waitFor({ state: "attached" });
  }

  @step("Validate modular account dialog is visible")
  async isModularAccountDialogVisible(): Promise<boolean> {
    try {
      await this.dialogContent.waitFor({ state: "visible", timeout: 10000 });
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
