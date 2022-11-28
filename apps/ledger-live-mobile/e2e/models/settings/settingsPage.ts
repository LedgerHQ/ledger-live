import { getElementById, tapByElement } from "../../helpers";

export default class SettingsPage {
  getGeneralSettingsButton = () => getElementById("general-settings-card");

  async navigateToGeneralSettings() {
    await tapByElement(this.getGeneralSettingsButton());
  }
}
