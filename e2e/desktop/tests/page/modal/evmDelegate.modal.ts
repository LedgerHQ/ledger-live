import { expect } from "@playwright/test";
import { Modal } from "tests/component/modal.component";
import { step } from "tests/misc/reporters/step";

export class EvmDelegateModal extends Modal {
  private earnRewardsEmptyStateButton = this.page.getByTestId("evm-earn-rewards-button");
  private rewardsInfoContinueButton = this.page.getByTestId("modal-continue-button");
  private validatorList = this.page.getByTestId("validator-list");
  private delegateContinueButton = this.page.locator("#delegate-continue-button");
  private amountField = this.page.getByTestId("modal-amount-field");
  private amountContinueButton = this.page.locator("#send-amount-continue-button");
  private transactionConfirm = this.page.getByTestId("device-action-transaction-confirm");
  private successMessageLabel = this.page.getByTestId("success-message-label");

  @step("Start EVM delegation flow from account empty state")
  async startFromEmptyState() {
    await this.earnRewardsEmptyStateButton.scrollIntoViewIfNeeded();
    await this.earnRewardsEmptyStateButton.click();
  }

  @step("Continue from EVM rewards info modal")
  async continueFromRewardsInfo() {
    await this.rewardsInfoContinueButton.click();
  }

  @step("Expect validator list to be visible")
  async expectValidatorListVisible() {
    await expect(this.validatorList).toBeVisible();
  }

  @step("Continue from the validator step (first validator is auto-selected)")
  async continueValidatorStep() {
    await this.delegateContinueButton.click();
  }

  @step("Fill delegation amount $0 and continue")
  async setAmountAndContinue(amount: string) {
    await this.amountField.fill(amount);
    await this.amountContinueButton.click();
  }

  @step("Expect device validation (sign transaction) screen to be displayed")
  async expectDeviceValidationScreen() {
    await expect(this.transactionConfirm).toBeVisible();
  }

  @step("Expect EVM delegation success message")
  async expectSuccessMessage() {
    await expect(this.successMessageLabel).toBeVisible();
  }
}
