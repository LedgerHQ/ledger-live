import { expect } from "@playwright/test";
import { Modal } from "tests/component/modal.component";
import { step } from "tests/misc/reporters/step";

export class UndelegateModal extends Modal {
  // Families holding several positions index their rows; those that delegate once do not.
  private rowSuffix = (rowIndex?: number) => (rowIndex === undefined ? "" : `-${rowIndex}`);
  private manageButton = (currencyId: string, rowIndex?: number) =>
    this.page.getByTestId(`${currencyId}-staking-manage-button${this.rowSuffix(rowIndex)}`);
  private unstakeMenuItem = (currencyId: string, rowIndex?: number) =>
    this.page.getByTestId(`${currencyId}-staking-unstake-item${this.rowSuffix(rowIndex)}`);
  private validatorField = this.page.getByTestId("sui-unstake-validator-field");
  private amountInput = this.page.getByTestId("sui-unstake-amount-input");
  private percentageButton = (pct: string) =>
    this.page.getByTestId(`sui-unstake-amount-pct-${pct}`);
  private infoMessage = this.page.getByTestId("sui-unstake-info-message");
  private amountContinueButton = this.page.getByTestId("sui-unstake-amount-continue-button");
  private successMessageLabel = this.page.getByTestId("success-message-label");
  private viewDetailsButton = this.page.getByTestId("sui-unstake-view-details-button");

  @step("Open the unstake flow from the staking-section manage menu")
  async openFromManageMenu(currencyId: string, rowIndex?: number) {
    await this.manageButton(currencyId, rowIndex).click();
    await this.unstakeMenuItem(currencyId, rowIndex).click();
  }

  @step("Verify validator name on the amount step")
  async verifyValidatorName(validatorName: string) {
    await expect(this.validatorField).toContainText(validatorName);
  }

  @step("Fill the unstake amount")
  async fillAmount(amount: string) {
    await this.amountInput.fill(amount);
  }

  @step("Verify percentage shortcut buttons are visible and enabled")
  async verifyPercentageButtonsVisible() {
    for (const pct of ["25", "50", "75", "100"]) {
      await expect(this.percentageButton(pct)).toBeVisible();
      await expect(this.percentageButton(pct)).toBeEnabled();
    }
  }

  @step("Verify the info message is visible")
  async verifyInfoMessage() {
    await expect(this.infoMessage).toBeVisible();
  }

  @step("Continue from the amount step")
  async continueFromAmount() {
    await this.amountContinueButton.click();
  }

  @step("Verify success message")
  async verifySuccessMessage() {
    await expect(this.successMessageLabel).toBeVisible();
  }

  @step("Click view details button")
  async clickViewDetailsButton() {
    await this.viewDetailsButton.click();
  }
}
