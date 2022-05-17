import * as testHelpers from "../helpers";

export default class PasswordEntryPage {
  static async enterPassword(password) {
    if (device.getPlatform() === "ios") {
      await element(by.type("RCTUITextField")).typeText(password);
    }

    if (device.getPlatform() === "android") {
      await element(by.type("android.widget.TextView")).typeText(password);
    }
  }

  static async login() {
    await testHelpers.tapByText("Log in");
  }
}
