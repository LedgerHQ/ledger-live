import { loadConfig } from "../bridge/server";
import PortfolioPage from "../models/wallet/portfolioPage";
import SwapFormPage from "../models/trade/swapFormPage";
import { getElementByText } from "../helpers";

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

  it("should be able to select a different source account", async () => {
    await swapPage.openSourceAccountSelector();
    await swapPage.selectSourceAccount("Bitcoin 1 (legacy)");
  });

  it("should be see an error for too low an amount", async () => {
    await swapPage.enterSourceAmount("0.00000001");
    await expect(
      getElementByText("Amount must be higher than 0.0001U+00a0BTC"), // Should fix this space character in the code
    ).toBeVisible();
  });

  it("should be see an error for not enough funds", async () => {
    await swapPage.enterSourceAmount("10");
    await expect(getElementByText("Sorry, insufficient funds")).toBeVisible();
  });
});
