import { getElementById, openDeeplink, tapByElement, waitForElementByID } from "../../helpers";

const baseLink = "portfolio";
export default class PortfolioPage {
  emptyPortfolioComponent = () => getElementById("PortfolioEmptyAccount");
  portfolioSettingsButton = () => getElementById("settings-icon");
  transferButton = () => getElementById("transfer-button");
  swapTransferMenuButton = () => getElementById("swap-transfer-button");

  navigateToSettings() {
    return tapByElement(this.portfolioSettingsButton());
  }

  openTransferMenu() {
    return tapByElement(this.transferButton());
  }

  navigateToSwapFromTransferMenu() {
    return tapByElement(this.swapTransferMenuButton());
  }

  waitForPortfolioPageToLoad() {
    return waitForElementByID("settings-icon");
  }

  openViaDeeplink() {
    return openDeeplink(baseLink);
  }
}
