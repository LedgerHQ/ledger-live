import { Step } from "jest-allure2-reporter/api";
import { TIMEOUT } from "@e2e/utils/timeouts";

export default class PasswordEntryPage {
  private readonly passwordTextInputId = "password-text-input";

  getPasswordTextInput = () => getElementById(this.passwordTextInputId);
  getLogin = () => getElementByText("Log in");

  @Step("Enter password")
  async enterPassword(password: string) {
    await tapByElement(this.getPasswordTextInput()); //prevent flakiness with Log in button not appearing
    await typeTextByElement(this.getPasswordTextInput(), password, false);
  }

  @Step("Login")
  async login() {
    await tapByElement(this.getLogin());
  }

  @Step("Expect lock")
  async expectLock() {
    await detoxExpect(this.getPasswordTextInput()).toBeVisible();
    await detoxExpect(this.getPasswordTextInput()).toBeVisible();
  }

  @Step("Expect no lock")
  async expectNoLock() {
    await waitForElementNotVisible(this.passwordTextInputId, TIMEOUT.medium);
    await detoxExpect(this.getPasswordTextInput()).not.toBeVisible();
  }
}
