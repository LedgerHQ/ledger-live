import { Step } from "jest-allure2-reporter/api";
import { byId } from "@e2e/helpers/elements/native";

export default class SettingsPage {
  private readonly generalSettingsButton = byId("general-settings-card-title");
  private readonly helpSettingsButton = byId("help-settings-card");

  @Step("Go to General Settings")
  async navigateToGeneralSettings() {
    await this.generalSettingsButton.tap();
  }

  @Step("Go to Help Settings")
  async navigateToHelpSettings() {
    await this.helpSettingsButton.tap();
  }
}
