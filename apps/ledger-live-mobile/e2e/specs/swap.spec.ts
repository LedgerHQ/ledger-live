import { loadConfig } from "../bridge/server";
import PortfolioPage from "../models/wallet/portfolioPage";
import SwapFormPage from "../models/trade/swapFormPage";

let portfolioPage: PortfolioPage;
let swapPage: SwapFormPage;

describe("Swap", () => {
  beforeAll(async () => {
    await loadConfig("1AccountBTC1AccountETH", true);
    portfolioPage = new PortfolioPage();
    swapPage = new SwapFormPage();
  });

  it("should load the Swap page from the Transfer menu", async () => {
    await portfolioPage.waitForPortfolioPageToLoad();
    await portfolioPage.openTransferMenu();
    await portfolioPage.navigateToSwapFromTransferMenu();
  });
});
