import * as detox from "detox";
import { loadConfig } from "../../bridge/server";
import PortfolioPage from "../../models/wallet/portfolioPage";
import SwapFormPage from "../../models/trade/swapFormPage";
import { isAndroid } from "../../helpers";
import LiveAppWebview from "../../models/liveApps/liveAppWebview";

let portfolioPage: PortfolioPage;
let swapPage: SwapFormPage;
let liveAppWebview: LiveAppWebview;

describe("DEX Swap", () => {
  beforeAll(async () => {
    loadConfig("1AccountBTC1AccountETHReadOnlyFalse", true);

    portfolioPage = new PortfolioPage();
    swapPage = new SwapFormPage();
    liveAppWebview = new LiveAppWebview();

    await portfolioPage.waitForPortfolioPageToLoad();
    await swapPage.openViaDeeplink();
    await detox.expect(swapPage.swapFormTab()).toBeVisible();
  });

  it("should be able to generate a quote with DEX providers available", async () => {
    await swapPage.openSourceAccountSelector();
    await swapPage.selectAccount("Ethereum 2");
    await swapPage.openDestinationAccountSelector();
    await swapPage.selectAccount("Tether USD");
    await swapPage.sendMax();
    await swapPage.goToProviderSelection();
    await swapPage.chooseProvider("1inch");
  });

  // FIXME site unavailable on Android CI
  it.skip("should be able to navigate to a DEX with the correct params", async () => {
    await swapPage.startExchange();

    await detox.expect(liveAppWebview.appTitle()).toHaveText(" https://1inch.io/"); // for some reason there is a space before the URL so this is required

    if (isAndroid()) {
      const title = await detox.web.element(detox.by.web.id("__next")).getTitle();
      expect(title).toBe("Ledger Platform Apps");

      // Full url: "https://dapp-browser.apps.ledger.com/?params=%7B%22dappUrl%22%3A%22https%3A%2F%2Fapp.1inch.io%2F%23%2F1%2Fsimple%2Fswap%2Feth%2Fusdt%3FledgerLive%3Dtrue%26sourceTokenAmount%3D11310048568372696785%22%2C%22nanoApp%22%3A%221inch%22%2C%22dappName%22%3A%221inch%22%2C%22networks%22%3A%5B%7B%22currency%22%3A%22ethereum%22%2C%22chainID%22%3A1%2C%22nodeURL%22%3A%22wss%3A%2F%2Feth-mainnet.ws.alchemyapi.io%2Fv2%2F0fyudoTG94QWC0tEtfJViM9v2ZXJuij2%22%7D%2C%7B%22currency%22%3A%22bsc%22%2C%22chainID%22%3A56%2C%22nodeURL%22%3A%22https%3A%2F%2Fbsc-dataseed.binance.org%2F%22%7D%2C%7B%22currency%22%3A%22polygon%22%2C%22chainID%22%3A137%2C%22nodeURL%22%3A%22https%3A%2F%2Fpolygon-mainnet.g.alchemy.com%2Fv2%2FoPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE%22%7D%5D%7D&theme=light&lang=en&name=1inch&accountId=mock%3A1%3Aethereum%3Atrue_ethereum_1%3A"
      const url = await detox.web.element(detox.by.web.id("__next")).getCurrentUrl();
      expect(url).toContain("app.1inch.io");
      expect(url).toContain("usdt");
      /**
       * Not sure if it makes sence to test the exact amount as it can be dynamic
       * (depending on network fees) and not specifically relevant for this test.
       * It might be more relevent in a unit test related to the swap logic.
       * Here it could make more sense to test the presence of a `sourceTokenAmount`
       * query param.
       * For example:
       * `expect(url).toContain("sourceTokenAmount%3D");`
       * or (to test that an amount is provided to the query param, without the need for the exact value):
       * `expect(url).toContain("sourceTokenAmount%3D11");`
       */
      expect(url).toContain("sourceTokenAmount%3D");
      expect(url).toContain("currency%22%3A%22ethereum");
      expect(url).toContain("accountId=mock%3A1%3Aethereum%3Atrue_ethereum_1%3A");

      await detox.expect(detox.web.element(detox.by.web.tag("iframe"))).toExist();
    }
  });
});
