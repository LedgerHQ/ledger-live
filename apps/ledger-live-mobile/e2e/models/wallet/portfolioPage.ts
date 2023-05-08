import {
  getElementById,
  openDeeplink,
  tapByElement,
  waitForElementByID,
} from "../../helpers";

let baseLink: string = "portfolio";

export default class PortfolioPage {
  emptyPortfolioComponent = () => getElementById("PortfolioEmptyAccount");
  portfolioSettingsButton = () => getElementById("settings-icon");

  async navigateToSettings() {
    await tapByElement(this.portfolioSettingsButton());
  }

  async waitForPortfolioPageToLoad() {
    await waitForElementByID("settings-icon");
  }

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }
}
