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
    await portfolioPage.openTransferMenu();
    await portfolioPage.navigateToSwapFromTransferMenu();
  });

  it("should be able to select a different source account", async () => {
    await swapPage.openSourceAccountSelector();
    await swapPage.selectAccount("Bitcoin 1 (legacy)");
  });

  it("should show an error for too low an amount", async () => {
    await swapPage.enterSourceAmount("0.00001");
    // unfortunately there's no way to check if a button that is disabled in the JS is actually disabled on the native side (which is what Detox checks)
    // we do `startExchange` to see if the next step fails as a way of checking if the exchange button disabled
    await swapPage.startExchange();
  });

  it("should show an error for not enough funds", async () => {
    await swapPage.enterSourceAmount("10");
    await swapPage.startExchange();
  });

  it("should be able to select a different destination account", async () => {
    await swapPage.openDestinationAccountSelector();
    await swapPage.selectAccount("Ethereum");
  });

  it("should be able to send the maximum available amount", async () => {
    await swapPage.sendMax();
    await swapPage.startExchange();
  });
});
