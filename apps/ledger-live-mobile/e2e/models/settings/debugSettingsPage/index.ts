import { getElementById, tapByElement } from "../../../helpers";

export default class DebugSettingsPage {
  getDebugFeaturesButton = () => getElementById("debug-settings-features-row");

  // Specific to the Debug/Features/Errors screen, feel free to move out of here.
  getDebugErrorsButton = () => getElementById("debug-settings-errors-row");
  getDebugErrorsSelectorButton = () => getElementById("debug-errors-selector");
  getDebugErrorsToggle = () => getElementById("debug-errors-toggle");
  getDebugErrorsSearchInput = () => getElementById("search-input");

  getDebugSettingsFeaturesRow = () =>
    getElementById("debug-settings-features-row");

  async navigateToDebugFeatures() {
    await tapByElement(this.getDebugSettingsFeaturesRow());
  }

  // Perhaps break this further into subsections
  async navigateToDebugFeaturesSettings() {
    await waitFor(this.getDebugFeaturesButton())
      .toBeVisible()
      .whileElement(by.id("settings-debug-page-scrollview"))
      .scroll(100, "down");

    await tapByElement(this.getDebugFeaturesButton());
  }

  async navigateToDebugErrors() {
    await waitFor(this.getDebugErrorsButton())
      .toBeVisible()
      .whileElement(by.id("settings-debug-features-page-scrollview"))
      .scroll(100, "down");

    await tapByElement(this.getDebugErrorsButton());
  }

  async openDebugErrorsSelector() {
    await tapByElement(this.getDebugErrorsSelectorButton());
  }

  async selectErrorByName(value: string) {
    await tapByElement(this.getDebugErrorsSearchInput());
    await this.getDebugErrorsSearchInput().typeText(value);
    await tapByElement(getElementById(value));
  }

  async toggleErrorRenderingType() {
    await tapByElement(this.getDebugErrorsToggle());
  }

  async closeModal() {
    await tapByElement(getElementById("modal-close-button"));
  }
}
