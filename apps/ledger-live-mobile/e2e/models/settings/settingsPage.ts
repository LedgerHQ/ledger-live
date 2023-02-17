import {
  getElementById,
  tapByElement,
  waitForElementByID,
} from "../../helpers";

export default class SettingsPage {
  generalSettingsButton = () => getElementById("general-settings-card");

  async navigateToGeneralSettings() {
    await waitForElementByID("general-settings-card");
    await tapByElement(this.generalSettingsButton());
  }
}
