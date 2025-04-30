import { expect } from "detox";

export default class PasswordEntryPage {
  getPasswordTextInput = () => getElementById("password-text-input");
  getLogin = () => getElementByText("Log in");

  @Step("Enter password")
  async enterPassword(password: string) {
    await tapByElement(await this.getPasswordTextInput()); //prevent flakiness with Log in button not appearing
    await typeTextByElement(await this.getPasswordTextInput(), password, false);
  }

  @Step("Login")
  async login() {
    await tapByElement(await this.getLogin());
  }

  @Step("Expect lock")
  async expectLock() {
    await expect(await this.getPasswordTextInput()).toBeVisible();
    await expect(await this.getPasswordTextInput()).toBeVisible();
  }

  @Step("Expect no lock")
  async expectNoLock() {
    await expect(await this.getPasswordTextInput()).not.toBeVisible();
    await expect(await this.getPasswordTextInput()).not.toBeVisible();
  }
}
