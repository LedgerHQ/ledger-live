import { Modal } from "../../component/modal.component";

export class PasswordlockModal extends Modal {
  private switchButton = this.page.locator("data-test-id=settings-password-lock-switch");
  private changeButton = this.page.locator("data-test-id=settings-password-change-button");
  private newPasswordInput = this.page.locator("data-test-id=new-password-input");
  private confirmPasswordInput = this.page.locator("data-test-id=confirm-password-input");
  private currentPasswordInput = this.page.locator("data-test-id=current-password-input");
  private disablePasswordInput = this.page.locator("data-test-id=disable-password-input");

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
