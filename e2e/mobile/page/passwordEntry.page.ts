import { Step } from "jest-allure2-reporter/api";
import { byId } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";

export default class PasswordEntryPage {
  private readonly passwordTextInput = byId("password-text-input");
  private readonly loginButton = byId("enabled-auth-unlock-login-button");

  @Step("Enter password")
  async enterPassword(password: string) {
    // The Log in button only renders while the input is focused, so the keyboard must stay open.
    await this.passwordTextInput.replaceTextKeepKeyboard(password);
  }

  @Step("Login")
  async login() {
    await this.loginButton.tap();
  }

  @Step("Expect lock")
  async expectLock() {
    await this.passwordTextInput.expectVisible();
  }

  @Step("Expect no lock")
  async expectNoLock() {
    await this.passwordTextInput.waitNotVisible(TIMEOUT.medium);
    await this.passwordTextInput.expectNotVisible();
  }
}
