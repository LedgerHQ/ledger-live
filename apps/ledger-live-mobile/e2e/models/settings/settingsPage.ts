import { getElementById, getElementByText, tapByElement } from "../../helpers";

export default class SettingsPage {
  getGeneralSettingsButton = () => getElementById("general-settings-card");
  getDebugSettingsButton = () => getElementByText("Debug");

  async navigateToGeneralSettings() {
    await tapByElement(this.getGeneralSettingsButton());
  }

  async navigateToDebugSettings() {
    await tapByElement(this.getDebugSettingsButton());
  }
}
