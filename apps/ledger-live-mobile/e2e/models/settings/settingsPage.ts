import {
  getElementById,
  tapByElement,
  waitForElementByID,
} from "../../helpers";

export default class SettingsPage {
  generalSettingsButton = () => getElementById("general-settings-card");
  getDebugSettingsButton = () => getElementById("debug-settings-card");
  async navigateToDebugSettings() {
    await waitFor(this.getDebugSettingsButton())
      .toBeVisible()
      .whileElement(by.id("settings-page-scrollview"))
      .scroll(100, "down");

    await tapByElement(this.getDebugSettingsButton());
  }
  async navigateToGeneralSettings() {
    await waitForElementByID("general-settings-card");
    await tapByElement(this.generalSettingsButton());
  }
}
