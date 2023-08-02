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

  navigateToSettings() {
    return tapByElement(this.portfolioSettingsButton());
  }

  openTransferMenu() {
    return tapByElement(this.transferButton());
  }

  navigateToSwapFromTransferMenu() {
    // await scrollToText("Exchange crypto to crypto.", "transfer-scroll-list"); // FIXME: scroll not working
    return tapByElement(this.swapTransferMenuButton());
  }

  waitForPortfolioPageToLoad() {
    return waitForElementById("settings-icon", 120000);
  }

  async waitForPortfolioReadOnly() {
    await waitForElementById(this.readOnlyPortfolioId);
    expect(await getTextOfElement(this.graphCardBalanceId)).toBe(this.zeroBalance);
    for (let index = 0; index < 4; index++)
      expect(await getTextOfElement(this.assetBalanceId, index)).toBe(this.zeroBalance);
  }

  openViaDeeplink() {
    return openDeeplink(baseLink);
  }

  openMarketPage() {
    return tapByElement(this.marketTabButton());
  }
}
