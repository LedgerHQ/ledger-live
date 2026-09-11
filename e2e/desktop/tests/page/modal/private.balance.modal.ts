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

  // Overrides Modal.close(). This flow keeps two step footers mounted at once
  // (ZCashExportKeyFlowModal StepDevice.tsx:138 and StepConfirmation.tsx:86),
  // each rendering a Button with data-testid="modal-close-button", so the base
  // locator hits two elements inside the container and Playwright fails on
  // strict mode. Scoping alone does not disambiguate them -- verified by running
  // the spec without this override. Match the visible one by role instead.
  @step("Close modal")
  async close() {
    await this.container.getByRole("button", { name: "Close" }).click();
  }
}
