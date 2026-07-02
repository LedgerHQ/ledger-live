import { expect } from "@playwright/test";
import { Modal } from "tests/component/modal.component";
import { step } from "tests/misc/reporters/step";

export class TezosStakeModal extends Modal {
  private readonly amountField = this.page.getByTestId("modal-amount-field");
  private readonly validatorContinueButton = this.page.locator(
    "#tezos-stake-validator-continue-button",
  );
  private readonly validatorList = this.page.getByTestId("validator-list");
  private readonly amountContinueButton = this.page.locator("#tezos-stake-amount-continue-button");
  private readonly visitAccountButton = this.page.locator(
    "#tezos-stake-confirmation-visit-account-button",
  );
  private readonly successMessageLabel = this.page.getByTestId("success-message-label");
  private readonly awaitingDelegationLabel = this.page.getByText("Confirming your delegation", {
    exact: false,
  });

  @step("Verify the validator step is shown")
  async verifyValidatorStep() {
    await expect(this.title).toBeVisible();
    await expect(this.validatorList).toBeVisible();
    await expect(this.validatorContinueButton).toBeVisible();
  }

  @step("Continue from the validator step")
  async continueFromValidator() {
    await this.validatorContinueButton.click();
  }

  @step("Fill stake amount $0")
  async fillAmount(amount: string) {
    if (amount === "send max") {
      await this.toggleMaxAmount();
    } else {
      await this.amountField.fill(amount);
    }
  }

  @step("Continue from the amount step")
  async continueFromAmount() {
    await this.amountContinueButton.click();
  }

  @step("Verify the awaiting-delegation step is shown")
  async verifyAwaitingDelegation() {
    await expect(this.awaitingDelegationLabel).toBeVisible();
  }

  @step("Verify success message")
  async verifySuccessMessage() {
    await expect(this.successMessageLabel).toBeVisible();
  }

  @step("Click visit account button")
  async clickVisitAccountButton() {
    await this.visitAccountButton.click();
  }
}
