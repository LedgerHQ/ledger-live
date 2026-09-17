import { expect } from "@playwright/test";
import { Modal } from "tests/component/modal.component";
import { step } from "tests/misc/reporters/step";

export class PrivateBalanceModal extends Modal {
  private modalTitle = this.container.getByText("Enable Zcash private balance");
  private birthdayInput = this.container.getByTestId("birthday-height");
  private finalMessage = this.container.getByText(/ufvk successfully imported/i);
  private confirmationCloseButton = this.container.getByTestId("modal-close-button-confirmation");

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

  // Overrides Modal.close(): the header close button shares the base
  // testid, this one is scoped to StepConfirmationFooter's own button.
  @step("Close modal")
  async close() {
    await this.confirmationCloseButton.click();
  }
}
