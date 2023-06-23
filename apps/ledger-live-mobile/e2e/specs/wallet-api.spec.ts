import { loadConfig, loadLocalManifest } from "../bridge/server";
import PortfolioPage from "../models/wallet/portfolioPage";
import SwapFormPage from "../models/trade/swapFormPage";
import { delay } from "../helpers";

let portfolioPage: PortfolioPage;
let swapPage: SwapFormPage;

describe("Swap", () => {
  beforeAll(async () => {
    portfolioPage = new PortfolioPage();
    swapPage = new SwapFormPage();

    loadConfig("1AccountBTC1AccountETHReadOnlyFalse", true);
    loadLocalManifest();
  });

  it("should load the Swap page from the Transfer menu", async () => {
    await portfolioPage.waitForPortfolioPageToLoad();
    await delay(100000000);
  });
});
