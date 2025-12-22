import { step } from "../../misc/reporters/step";
import { AccountType, getParentAccountName } from "@ledgerhq/live-common/e2e/enum/Account";
import { Dialog } from "../../component/dialog.component";
import { expect } from "@playwright/test";

export class ModularAccountDialog extends Dialog {
  private dialogContent = this.page.getByTestId("modular-dialog-screen-ACCOUNT_SELECTION");
  private accountRowByName = (accountName: string) =>
    this.page.locator("[data-testid^='account-row-']").filter({ hasText: accountName });
  private addNewExistingAccountButton = this.page.getByRole("button", {
    name: "Add new or existing account",
  });

  @step("Wait for dialog to be visible")
  async waitForDialogToBeVisible() {
    await expect(this.content).toBeVisible();
    await this.dialogOverlay.waitFor({ state: "attached" });
  }

  @step("Validate modular account dialog is visible")
  async isModularAccountDialogVisible(): Promise<boolean> {
    await this.waitForDialogToBeVisible();
    return await this.dialogContent.isVisible();
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
