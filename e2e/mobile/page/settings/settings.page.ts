export default class SettingsPage {
  settingsGeneralButtonId = "general-settings-card";
  settingsHelpButtonId = "help-settings-card";

  @Step("Go to General Settings")
  async navigateToGeneralSettings() {
    await waitForElementById(this.settingsGeneralButtonId);
    await tapById(this.settingsGeneralButtonId);
  }

  @Step("Go to Help Settings")
  async navigateToHelpSettings() {
    await waitForElementById(this.settingsHelpButtonId);
    await tapById(this.settingsHelpButtonId);
  }
}
