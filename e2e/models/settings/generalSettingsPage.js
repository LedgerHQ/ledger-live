import * as testHelpers from "../../helpers";

export default class GeneralSettingsPage {
  static async togglePassword() {
    if (device.getPlatform() === "ios") {
      await element(by.type("RCTSwitch"))
        .atIndex(0)
        .tap();
    }

    if (device.getPlatform() === "android") {
      await element(by.type("android.widget.Switch"))
        .atIndex(0)
        .tap();
    }
  }

  static async enterNewPassword(passwordText) {
    if (device.getPlatform() === "ios") {
      await element(by.type("RCTUITextField")).typeText(passwordText);
    }

    if (device.getPlatform() === "android") {
      await element(by.type("android.widget.TextView")).typeText(passwordText);
    }
    await testHelpers.tapByText("Confirm");
  }

  static async isVisible() {
    await testHelpers.verifyTextIsVisible("Preferred currency");
  }
}
