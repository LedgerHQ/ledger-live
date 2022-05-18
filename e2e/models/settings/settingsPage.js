import * as testHelpers from "../../helpers";

export default class SettingsPage {
  static async navigateToGeneralSettings() {
    await testHelpers.tap("general-settings-card");
  }
}
