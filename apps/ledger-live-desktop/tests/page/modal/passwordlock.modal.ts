import { step } from "tests/misc/reporters/step";
import { Modal } from "../../component/modal.component";

export class PasswordlockModal extends Modal {
  private switchButton = this.page.getByTestId("settings-password-lock-switch");
  private changeButton = this.page.getByTestId("settings-password-change-button");
  private newPasswordInput = this.page.getByTestId("new-password-input");
  private confirmPasswordInput = this.page.getByTestId("confirm-password-input");
  private currentPasswordInput = this.page.getByTestId("current-password-input");
  private disablePasswordInput = this.page.getByTestId("disable-password-input");

  @step("Toggle password lock")
  async toggle() {
    await this.switchButton.click();
  }

  async openChangePasswordModal() {
    await this.changeButton.click();
  }

  async enablePassword(newPassword: string, confirmPassword: string) {
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.saveButton.click();
  }

  async disablePassword(password: string) {
    await this.disablePasswordInput.fill(password);
    await this.saveButton.click();
  }

  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
    await this.currentPasswordInput.fill(currentPassword);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.saveButton.click();
  }
}
