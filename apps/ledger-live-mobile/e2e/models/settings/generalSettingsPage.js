import * as testHelpers from "../../helpers";

export default class GeneralSettingsPage {
  static async togglePassword() {
    await element(by.id("password-settings-switch"))
      .atIndex(0)
      .tap();
  }

  static async enterNewPassword(passwordText) {
    await element(by.id("password-text-input")).typeText(passwordText);
    await testHelpers.tapByText("Confirm");
  }

  static async isVisible() {
    await testHelpers.verifyTextIsVisible("Preferred currency");
  }
}
