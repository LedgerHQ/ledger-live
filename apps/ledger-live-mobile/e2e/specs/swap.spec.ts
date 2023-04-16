import { loadConfig } from "../bridge/server";
import PortfolioPage from "../models/wallet/portfolioPage";
import SwapFormPage from "../models/trade/swapFormPage";

let portfolioPage: PortfolioPage;
let swapPage: SwapFormPage;

describe("Swap", () => {
  beforeAll(async () => {
    await loadConfig("1AccountBTC1AccountETHReadOnlyFalse", true);
    portfolioPage = new PortfolioPage();
    swapPage = new SwapFormPage();
  });

  it("should load the Swap page from the Transfer menu", async () => {
    await portfolioPage.waitForPortfolioPageToLoad();
    await portfolioPage.openTransferMenu();
    await portfolioPage.navigateToSwapFromTransferMenu();
  });

  it("should be able to select a different source account ", async () => {
    await swapPage.openSourceAccountSelector();
    await swapPage.selectSourceAccount("Bitcoin 1 (legacy)");
  });
});
