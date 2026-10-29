import { Step } from "jest-allure2-reporter/api";
import { byId } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";

export default class AppLockPage {
  private readonly setupPasswordField = byId("app-lock-setup-password-field");
  private readonly setupPasswordContinue = byId("app-lock-setup-password-continue");
  private readonly confirmPasswordField = byId("app-lock-confirm-password-field");
  private readonly confirmPasswordButton = byId("app-lock-confirm-password-confirm");
  private readonly unlockScreen = byId("app-lock-unlock-screen");
  private readonly unlockField = byId("app-lock-unlock-field");
  private readonly unlockSubmit = byId("app-lock-unlock-submit");

  @Step("Choose password")
  async choosePassword(password: string) {
    await this.setupPasswordField.replaceTextKeepKeyboard(password);
    await this.setupPasswordContinue.tap();
  }

  @Step("Confirm password")
  async confirmPassword(password: string) {
    await this.confirmPasswordField.replaceTextKeepKeyboard(password);
    await this.confirmPasswordButton.tap();
  }

  @Step("Expect the password to be refused as too short")
  async expectPasswordTooShort() {
    await this.setupPasswordField.waitVisible();
    await this.confirmPasswordField.waitGone();
  }

  @Step("Enter unlock password")
  async enterUnlockPassword(password: string) {
    await this.unlockField.replaceTextKeepKeyboard(password);
  }

  @Step("Unlock")
  async unlock() {
    await this.unlockSubmit.tap();
  }

  @Step("Expect lock")
  async expectLock() {
    await this.unlockScreen.waitVisible();
  }

  @Step("Expect no lock")
  async expectNoLock() {
    await this.unlockScreen.waitGone(TIMEOUT.medium);
  }
}
