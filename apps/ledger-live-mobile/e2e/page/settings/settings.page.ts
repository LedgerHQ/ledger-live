import { tapById, waitForElementById } from "../../helpers";

export default class SettingsPage {
  settingsGeneralButtonId = "general-settings-card";

  async navigateToGeneralSettings() {
    await waitForElementById(this.settingsGeneralButtonId);
    await tapById(this.settingsGeneralButtonId);
  }
}
