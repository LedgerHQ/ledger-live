import { expect } from "detox";

export default class PasswordEntryPage {
  getPasswordTextInput = () => getElementById("password-text-input");
  getLogin = () => getElementByText("Log in");

  async enterPassword(password: string) {
    await tapByElement(this.getPasswordTextInput()); //prevent flakiness with Log in button not appearing
    await typeTextByElement(this.getPasswordTextInput(), password, false);
  }

  async login() {
    await tapByElement(this.getLogin());
  }

  async expectLock() {
    await expect(this.getPasswordTextInput()).toBeVisible();
    await expect(this.getPasswordTextInput()).toBeVisible();
  }

  async expectNoLock() {
    await expect(this.getPasswordTextInput()).not.toBeVisible();
    await expect(this.getPasswordTextInput()).not.toBeVisible();
  }
}
