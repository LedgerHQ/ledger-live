import { Step } from "jest-allure2-reporter/api";

export default class AppLockPage {
  getSetupPasswordField = () => getElementById("app-lock-setup-password-field");
  getSetupPasswordContinue = () => getElementById("app-lock-setup-password-continue");
  getConfirmPasswordField = () => getElementById("app-lock-confirm-password-field");
  getConfirmPasswordButton = () => getElementById("app-lock-confirm-password-confirm");
  getUnlockScreen = () => getElementById("app-lock-unlock-screen");
  getUnlockField = () => getElementById("app-lock-unlock-field");
  getUnlockSubmit = () => getElementById("app-lock-unlock-submit");

  @Step("Choose password")
  async choosePassword(password: string) {
    await typeTextByElement(this.getSetupPasswordField(), password, false);
    await tapByElement(this.getSetupPasswordContinue());
  }

  @Step("Confirm password")
  async confirmPassword(password: string) {
    await typeTextByElement(this.getConfirmPasswordField(), password, false);
    await tapByElement(this.getConfirmPasswordButton());
  }

  @Step("Expect the password to be refused as too short")
  async expectPasswordTooShort() {
    await detoxExpect(this.getSetupPasswordField()).toBeVisible();
    await detoxExpect(this.getConfirmPasswordField()).not.toBeVisible();
  }

  @Step("Enter unlock password")
  async enterUnlockPassword(password: string) {
    await typeTextByElement(this.getUnlockField(), password, false);
  }

  @Step("Unlock")
  async unlock() {
    await tapByElement(this.getUnlockSubmit());
  }

  @Step("Expect lock")
  async expectLock() {
    await detoxExpect(this.getUnlockScreen()).toBeVisible();
  }

  @Step("Expect no lock")
  async expectNoLock() {
    await detoxExpect(this.getUnlockScreen()).not.toBeVisible();
  }
}
