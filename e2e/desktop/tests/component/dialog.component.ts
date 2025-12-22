import { Component } from "tests/page/abstractClasses";
import { step } from "tests/misc/reporters/step";
import { Account, getParentAccountName } from "@ledgerhq/live-common/e2e/enum/Account";
import { expect } from "@playwright/test";

export class Dialog extends Component {
  readonly content = this.page.getByRole("dialog");
  readonly dialogOverlay = this.page.locator("[data-slot='dialog-overlay']");
  readonly closeButton = this.page.locator('[aria-label="Close"]').first();
  private addAccountButton = this.page.getByRole("button", { name: "Add new or existing account" });

  @step("Wait for dialog to be visible")
  async waitForDialogToBeVisible() {
    await expect(this.content).toBeVisible();
    await expect(this.closeButton).toBeVisible();
    await this.dialogOverlay.waitFor({ state: "attached" });
  }

  @step("Close dialog")
  async closeDialog() {
    await this.closeButton.click();
  }

  public getAccountButton = (accountName: string) =>
    this.page.getByTestId(`account-row-${accountName.toLowerCase()}-0`).first();

  @step("Select account by name")
  async selectAccountByName(account: Account) {
    await this.getAccountButton(account.currency.name)
      .locator(`text=${getParentAccountName(account)}`)
      .click();
  }

  @step("Click on add account button")
  async clickOnAddAccountButton() {
    await this.addAccountButton.click();
  }
}
