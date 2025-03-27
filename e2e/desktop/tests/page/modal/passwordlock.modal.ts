import { step } from "../../misc/reporters/step";
import { Modal } from "../../component/modal.component";

export class PasswordlockModal extends Modal {
  private readonly switchButton = this.page.getByTestId("settings-password-lock-switch");
  private readonly newPasswordInput = this.page.getByTestId("new-password-input");
  private readonly confirmPasswordInput = this.page.getByTestId("confirm-password-input");
  readonly saveButton = this.page.getByTestId("modal-save-button");
  private readonly cancelButton = this.page.getByTestId("modal-cancel-button");

  @step("Toggle password lock")
  async toggle() {
    await this.switchButton.click();
  }

  async enablePassword(newPassword: string, confirmPassword: string) {
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.saveButton.click();
  }

  @step("Click Cancel button")
  async clickCancel() {
    await this.cancelButton.click();
  }
}
