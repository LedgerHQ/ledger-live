import { expect } from "detox";
import { loadConfig } from "../../bridge/server";
import PortfolioPage from "../../models/wallet/portfolioPage";
import SwapFormPage from "../../models/trade/swapFormPage";

let portfolioPage: PortfolioPage;
let swapPage: SwapFormPage;

describe("Swap", () => {
  beforeAll(async () => {
    loadConfig("1AccountBTC1AccountETHReadOnlyFalse", true);

    portfolioPage = new PortfolioPage();
    swapPage = new SwapFormPage();

    await portfolioPage.waitForPortfolioPageToLoad();
  });

  it("should be able to navigate to a DEX", async () => {
    await portfolioPage.openTransferMenu();
    await portfolioPage.navigateToSwapFromTransferMenu();
    await swapPage.openSourceAccountSelector();
    await swapPage.selectAccount("Ethereum 2");
    await swapPage.openDestinationAccountSelector();
    await swapPage.selectAccount("Tether USD");
    await swapPage.sendMax();
    await swapPage.goToProviderSelection();
    await swapPage.chooseProvider("1inch");
    await swapPage.startExchange();
  });
});
