import { expect } from "@playwright/test";
import { Modal } from "../../component/modal.component";
import { step } from "tests/misc/reporters/step";

export class AddAccountModal extends Modal {
  private selectAccount = this.page.locator("text=Choose a crypto asset"); // FIXME: I need an id
  readonly selectAccountInput = this.page.locator('[placeholder="Search"]'); // FIXME: I need an id
  readonly addAccountsButton = this.page.getByTestId("add-accounts-import-add-button");
  private deselectAllButton = this.page.getByText("Deselect all");
  private checkbox = this.page.getByTestId("accountRow-checkbox").first();
  private accountsList = this.page.getByTestId("add-accounts-step-import-accounts-list");
  private stopButton = this.page.getByTestId("add-accounts-import-stop-button");
  private doneButton = this.page.getByTestId("add-accounts-finish-close-button");
  private successAddLabel = this.page.locator("text=Account added successfully");

  @step("Select currency $0")
  async select(currency: string) {
    await this.selectAccount.click();
    await this.selectAccountInput.fill(currency);
    await this.selectAccountInput.press("Enter");
    await this.page.mouse.move(0, 0);
  }

  @step("click `Add Accounts` button - mocked tests")
  async addAccountsMocked() {
    await this.addAccountsButton.click();
    await expect(this.successAddLabel).toBeVisible();
  }

  @step("Click `Add Accounts` button")
  async addAccounts() {
    if (await this.deselectAllButton.isVisible()) {
      await this.deselectAllButton.click();
      await this.checkbox.click({ force: true });
    }
    await this.addAccountsButton.click();
    await expect(this.successAddLabel).toBeVisible();
  }

  @step("Get fist account name")
  async getFirstAccountName() {
    await this.page.waitForTimeout(500);
    return await this.accountsList.locator("input").first().inputValue();
  }

  @step("Click `Done` button")
  async done() {
    await this.doneButton.click();
  }

  @step("Wait for sync")
  async waitForSync() {
    await this.stopButton.waitFor({ state: "hidden" });
    await this.addAccountsButton.waitFor({ state: "visible" });
  }
}
