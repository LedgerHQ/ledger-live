export default class SettingsPage {
  settingsGeneralButtonId = "general-settings-card";

  @Step("Go to General Settings")
  async navigateToGeneralSettings() {
    await waitForElementById(this.settingsGeneralButtonId);
    await tapById(this.settingsGeneralButtonId);
  }
}
