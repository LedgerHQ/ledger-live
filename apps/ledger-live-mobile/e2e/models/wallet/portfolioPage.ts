import {
  getElementById,
  tapByElement,
  waitForElementByID,
} from "../../helpers";

export default class PortfolioPage {
  emptyPortfolioComponent = () => getElementById("PortfolioEmptyAccount");
  portfolioSettingsButton = () => getElementById("settings-icon");

  async navigateToSettings() {
    await tapByElement(this.portfolioSettingsButton());
  }

  async waitForPortfolioPageToLoad() {
    await waitForElementByID("settings-icon");
  }
}
