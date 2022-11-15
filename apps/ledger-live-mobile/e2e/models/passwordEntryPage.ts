import * as testHelpers from "../helpers";

export default class PasswordEntryPage {
  static async enterPassword(password) {
    await testHelpers.typeText("password-text-input", password);
  }

  static async login() {
    await testHelpers.tapByText("Log in");
  }
}
