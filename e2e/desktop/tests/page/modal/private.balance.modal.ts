import { expect } from "@playwright/test";
import { Modal } from "tests/component/modal.component";
import { step } from "tests/misc/reporters/step";

export class PrivateBalanceModal extends Modal {
  private modalTitle = this.page.getByText("Enable Zcash private balance");
  private birthdayInput = this.page.getByTestId("birthday-height");
  private finalMessage = this.page.getByText(/ufvk successfully imported/i);

  readonly continueButton = this.page.getByRole("button", { name: "Continue" });

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
}
