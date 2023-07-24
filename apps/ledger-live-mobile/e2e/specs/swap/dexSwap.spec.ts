import * as detox from "detox";
import { loadConfig } from "../../bridge/server";
import PortfolioPage from "../../models/wallet/portfolioPage";
import SwapFormPage from "../../models/trade/swapFormPage";
import { isAndroid } from "../../helpers";

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

    if (isAndroid()) {
      const title = await detox.web.element(detox.by.web.id("__next")).getTitle();
      expect(title).toBe("Ledger Platform Apps");

      const url = await detox.web.element(detox.by.web.id("__next")).getCurrentUrl();
      expect(url).toBe(
        "https://dapp-browser.apps.ledger.com/?params=%7B%22dappUrl%22%3A%22https%3A%2F%2Fapp.1inch.io%2F%23%2F1%2Fsimple%2Fswap%2Feth%2Fusdt%3FledgerLive%3Dtrue%26sourceTokenAmount%3D11309838568372696785%22%2C%22nanoApp%22%3A%221inch%22%2C%22dappName%22%3A%221inch%22%2C%22networks%22%3A%5B%7B%22currency%22%3A%22ethereum%22%2C%22chainID%22%3A1%2C%22nodeURL%22%3A%22wss%3A%2F%2Feth-mainnet.ws.alchemyapi.io%2Fv2%2F0fyudoTG94QWC0tEtfJViM9v2ZXJuij2%22%7D%2C%7B%22currency%22%3A%22bsc%22%2C%22chainID%22%3A56%2C%22nodeURL%22%3A%22https%3A%2F%2Fbsc-dataseed.binance.org%2F%22%7D%2C%7B%22currency%22%3A%22polygon%22%2C%22chainID%22%3A137%2C%22nodeURL%22%3A%22https%3A%2F%2Fpolygon-mainnet.g.alchemy.com%2Fv2%2FoPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE%22%7D%5D%7D&theme=light&lang=en&name=1inch&accountId=mock%3A1%3Aethereum%3Atrue_ethereum_1%3A",
      );

      await detox.expect(detox.web.element(detox.by.web.tag("iframe"))).toExist();
    }
  });
});
