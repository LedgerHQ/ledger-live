import { loadConfig } from "../bridge/server";
import PortfolioPage from "../models/wallet/portfolioPage";
import SwapFormPage from "../models/trade/swapFormPage";
import ErrorElement from "../models/generic/errorElement";

let portfolioPage: PortfolioPage;
let swapPage: SwapFormPage;
let error: ErrorElement;

describe("Swap", () => {
  beforeAll(async () => {
    await loadConfig("1AccountBTC1AccountETHReadOnlyFalse", true);
    portfolioPage = new PortfolioPage();
    swapPage = new SwapFormPage();
    error = new ErrorElement();
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
    // await expect(
    //   element(by.text("Amount must be higher than 0.0001U+00a0BTC")), // Should fix this space character in the code
    // ).toBeVisible();
    await expect(error.errorMessage()).toBeVisible();
  });

  it("should show an error for not enough funds", async () => {
    await swapPage.enterSourceAmount("10");
    // await expect(element(by.id("error"))).toBeVisible();
  });

  it("should be able to select a different destination account", async () => {
    await swapPage.openDestinationAccountSelector();
    await swapPage.selectAccount("Ethereum");
  });
});
