import { expect, web, by } from "detox";
import { isAndroid } from "../../helpers";
import { Application } from "../../page";
import jestExpect from "expect";

let app: Application;

describe("DEX Swap", () => {
  beforeAll(async () => {
    app = await Application.init("1AccountBTC1AccountETHReadOnlyFalse");

    await app.portfolio.waitForPortfolioPageToLoad();
    await app.swap.openViaDeeplink();
    await app.swap.expectSwapPage();
  });

  it("should be able to generate a quote with DEX providers available", async () => {
    await app.swap.openSourceAccountSelector();
    await app.swap.selectAccount("Ethereum 2");
    await app.swap.openDestinationAccountSelector();
    await app.swap.selectAccount("Tether USD");
    await app.swap.enterSourceAmount("1");
    await app.swap.goToProviderSelection();
    await app.swap.chooseProvider("1inch");
  });

  // FIXME site unavailable on Android CI
  it.skip("should be able to navigate to a DEX with the correct params", async () => {
    await app.swap.startExchange();

    await expect(app.liveAppWebview.appTitle()).toHaveText(" https://1inch.io/"); // for some reason there is a space before the URL so this is required

    if (isAndroid()) {
      const title = await web.element(by.web.id("__next")).getTitle();
      jestExpect(title).toBe("Ledger Platform Apps");

      // Full url: "https://dapp-browser.apps.ledger.com/?params=%7B%22dappUrl%22%3A%22https%3A%2F%2Fapp.1inch.io%2F%23%2F1%2Fsimple%2Fswap%2Feth%2Fusdt%3FledgerLive%3Dtrue%26sourceTokenAmount%3D11310048568372696785%22%2C%22nanoApp%22%3A%221inch%22%2C%22dappName%22%3A%221inch%22%2C%22networks%22%3A%5B%7B%22currency%22%3A%22ethereum%22%2C%22chainID%22%3A1%2C%22nodeURL%22%3A%22wss%3A%2F%2Feth-mainnet.ws.alchemyapi.io%2Fv2%2F0fyudoTG94QWC0tEtfJViM9v2ZXJuij2%22%7D%2C%7B%22currency%22%3A%22bsc%22%2C%22chainID%22%3A56%2C%22nodeURL%22%3A%22https%3A%2F%2Fbsc-dataseed.binance.org%2F%22%7D%2C%7B%22currency%22%3A%22polygon%22%2C%22chainID%22%3A137%2C%22nodeURL%22%3A%22https%3A%2F%2Fpolygon-mainnet.g.alchemy.com%2Fv2%2FoPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE%22%7D%5D%7D&theme=light&lang=en&name=1inch&accountId=mock%3A1%3Aethereum%3Atrue_ethereum_1%3A"
      const url = await web.element(by.web.id("__next")).getCurrentUrl();
      jestExpect(url).toContain("app.1inch.io");
      jestExpect(url).toContain("usdt");
      /**
       * Not sure if it makes sence to test the exact amount as it can be dynamic
       * (depending on network fees) and not specifically relevant for this test.
       * It might be more relevent in a unit test related to the swap logic.
       * Here it could make more sense to test the presence of a `sourceTokenAmount`
       * query param.
       * For example:
       * `jestExpect(url).toContain("sourceTokenAmount%3D");`
       * or (to test that an amount is provided to the query param, without the need for the exact value):
       * `jestExpect(url).toContain("sourceTokenAmount%3D11");`
       */
      jestExpect(url).toContain("sourceTokenAmount%3D");
      jestExpect(url).toContain("currency%22%3A%22ethereum");
      jestExpect(url).toContain("accountId=mock%3A1%3Aethereum%3Atrue_ethereum_1%3A");

      await expect(web.element(by.web.tag("iframe"))).toExist();
    }
  });
});
