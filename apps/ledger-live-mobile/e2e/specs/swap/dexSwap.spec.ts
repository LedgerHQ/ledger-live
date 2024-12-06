import { Application } from "../../page";

const app = new Application();

describe("DEX Swap", () => {
  beforeAll(async () => {
    await app.init({ userdata: "1AccountBTC1AccountETHReadOnlyFalse" });

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
  it("should be able to navigate to a DEX with the correct params", async () => {
    await app.swap.startExchange();

    await app.discover.expectApp("1inch");
    await app.discover.expect1inchParams();
  });
});
