import { expect } from "@playwright/test";
import { Modal } from "../../component/modal.component";
import { step } from "tests/misc/reporters/step";

export class AddAccountModal extends Modal {
  private selectAccount = this.page.locator("text=Choose a crypto asset"); // FIXME: I need an id
  readonly selectAccountInput = this.page.locator('[placeholder="Search"]'); // FIXME: I need an id
  readonly addAccountsButton = this.page.locator("data-test-id=add-accounts-import-add-button");
  private accountsList = this.page.locator("data-test-id=add-accounts-step-import-accounts-list");
  private stopButton = this.page.locator("data-test-id=add-accounts-import-stop-button");
  private doneButton = this.page.locator("data-test-id=add-accounts-finish-close-button");
  private successAddLabel = this.page.locator("text=Account added successfully");

  @step("Select currency $0")
  async select(currency: string) {
    await this.selectAccount.click();
    await this.selectAccountInput.fill(currency);
    await this.selectAccountInput.press("Enter");
    await this.page.mouse.move(0, 0);
  }

  async selectCurrency(currency: string) {
    await this.select(currency);
    await this.continue();
    await this.waitForSync();
  }

  @step("Click `Add Accounts` button")
  async addAccounts() {
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

  @step("Check that add account modal elements are visible")
  async expectModalVisiblity() {
    expect(await this.title.textContent()).toBe("Add accounts");
    await expect(this.selectAccount).toBeVisible();
  }
}
