import * as testHelpers from "../helpers";

export default class PortfolioPage {
  static async waitForPageToBeVisible() {
    await testHelpers.waitForElement("settings-icon");
  }

  static async navigateToSettings() {
    await testHelpers.tap("settings-icon");
  }

  static async emptyPortfolioIsVisible() {
    await testHelpers.verifyTextIsVisible("Add asset");
  }
}
