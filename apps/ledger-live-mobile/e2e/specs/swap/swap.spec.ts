import { expect } from "detox";
import { loadConfig } from "../../bridge/server";
import PortfolioPage from "../../models/wallet/portfolioPage";
import SwapFormPage from "../../models/trade/swapFormPage";

let portfolioPage: PortfolioPage;
let swapPage: SwapFormPage;

describe("Swap", () => {
  beforeAll(async () => {
    await loadConfig("1AccountBTC1AccountETHReadOnlyFalse", true);

    portfolioPage = new PortfolioPage();
    swapPage = new SwapFormPage();

    await portfolioPage.waitForPortfolioPageToLoad();
  });

  it("should load the Swap page from the Transfer menu", async () => {
    await swapPage.openViaDeeplink();
    await expect(swapPage.swapFormTab()).toBeVisible();
  });

  it("should be able to select a different source account", async () => {
    await swapPage.openSourceAccountSelector();
    await swapPage.selectAccount("Bitcoin 1 (legacy)");
  });

  it("should show an error for too low an amount", async () => {
    await swapPage.enterSourceAmount("0.00001");
    // unfortunately there's no way to check if a button that is disabled in the JS is actually disabled on the native side (which is what Detox checks)
    // we tap the `Exchange` button to see if the next step fails as a way of checking if the exchange button disabled. If it proceeds then the button was incorrectly available and the next test will fail
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
    await expect(swapPage.termsAcceptButton()).toBeVisible();
    await expect(swapPage.termsCloseButton()).toBeVisible();
  });
});
