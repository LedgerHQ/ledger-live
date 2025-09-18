export default class PasswordEntryPage {
  getPasswordTextInput = () => getElementById("password-text-input");
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
    await detoxExpect(this.getPasswordTextInput()).not.toBeVisible();
    await detoxExpect(this.getPasswordTextInput()).not.toBeVisible();
  }
}
