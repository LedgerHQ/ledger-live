import {
  getElementById,
  getTextOfElement,
  openDeeplink,
  tapByElement,
  waitForElementById,
} from "../../helpers";

const baseLink = "portfolio";
export default class PortfolioPage {
  zeroBalance = "$0.00";
  graphCardBalanceId = "graphCard-balance";
  assetBalanceId = "asset-balance";
  readOnlyPortfolioId = "PortfolioReadOnlyList";
  emptyPortfolioComponent = () => getElementById("PortfolioEmptyAccount");
  portfolioSettingsButton = () => getElementById("settings-icon");
  transferButton = () => getElementById("transfer-button");
  swapTransferMenuButton = () => getElementById("swap-transfer-button");
  marketTabButton = () => getElementById("tab-bar-market");

  async navigateToSettings() {
    await tapByElement(this.portfolioSettingsButton());
  }

  async openTransferMenu() {
    await tapByElement(this.transferButton());
  }

  async navigateToSwapFromTransferMenu() {
    await tapByElement(this.swapTransferMenuButton());
  }

  async waitForPortfolioPageToLoad() {
    await waitForElementById("settings-icon");
  }

  async waitForPortfolioReadOnly() {
    await waitForElementById(this.readOnlyPortfolioId);
    expect(await getTextOfElement(this.graphCardBalanceId)).toBe(this.zeroBalance);
    for (let index = 0; index < 4; index++)
      expect(await getTextOfElement(this.assetBalanceId, index)).toBe(this.zeroBalance);
  }

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }

  openMarketPage() {
    return tapByElement(this.marketTabButton());
  }
}
