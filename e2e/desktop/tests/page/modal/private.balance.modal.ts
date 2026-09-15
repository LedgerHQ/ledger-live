import { expect } from "@playwright/test";
import { Modal } from "tests/component/modal.component";
import { step } from "tests/misc/reporters/step";

export class PrivateBalanceModal extends Modal {
  private modalTitle = this.container.getByText("Enable Zcash private balance");
  private birthdayInput = this.container.getByTestId("birthday-height");
  private finalMessage = this.container.getByText(/ufvk successfully imported/i);

  readonly continueButton = this.container.getByRole("button", { name: "Continue" });

  @step("Retrieve modal title")
  async expectModalVisibility() {
    await expect(this.modalTitle).toBeVisible();
  }

  @step("Edit birthday height")
  async editBirthdayHeight(birthdayHeight: string) {
    await this.birthdayInput.fill(birthdayHeight);
    expect(await this.birthdayInput.inputValue()).toBe(birthdayHeight);
  }

  @step("Click continue button")
  async clickContinue() {
    await this.continueButton.click();
  }

  @step("Confirm UFVK exported from device")
  async confirmUfvkExportedFromDevice() {
    await expect(this.finalMessage).toBeVisible();
  }

  // Overrides Modal.close(): on this step, the generic modal-header close
  // button and StepConfirmationFooter's own Close button (which also disables
  // auto-sync-now, ZCashExportKeyFlowModal/steps/StepConfirmation.tsx) are both
  // present, and the base locator's data-testid="modal-close-button" matches
  // the header's button too. Target the confirmation footer's button by its
  // own testid instead of relying on role/visibility to disambiguate.
  @step("Close modal")
  async close() {
    await this.container.getByTestId("modal-close-button-confirmation").click();
  }
}
