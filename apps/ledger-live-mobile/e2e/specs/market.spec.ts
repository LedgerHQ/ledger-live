import { expect, web, by } from "detox";
import PortfolioPage from "../models/wallet/portfolioPage";
import MarketPage from "../models/market/marketPage";
import { loadConfig } from "../bridge/server";
import { isAndroid, getElementByText } from "../helpers";
import jestExpect from "expect";

let portfolioPage: PortfolioPage;
let marketPage: MarketPage;

describe("Market page for user with no device", () => {
  beforeAll(async () => {
    loadConfig("1accountEth", true);
    portfolioPage = new PortfolioPage();
    marketPage = new MarketPage();
  });

  it("should find the researched crypto", async () => {
    await portfolioPage.waitForPortfolioPageToLoad();
    await portfolioPage.openMarketPage();
    await marketPage.searchAsset("btc\n");
    await expect(getElementByText("Bitcoin (BTC)")).toBeVisible();
  });

  it("should filter starred asset in the list", async () => {
    await marketPage.openAssetPage("Bitcoin (BTC)");
    await marketPage.starFavoriteCoin();
    await marketPage.backToAssetList();
    await marketPage.filterStaredAsset();
    await expect(getElementByText("Bitcoin (BTC)")).toBeVisible();
  });

  // FIXME Javascript error on webview
  it.skip("should redirect to the buy a nano marketplace page", async () => {
    await marketPage.openAssetPage("Bitcoin (BTC)");
    await marketPage.buyNano();
    await marketPage.openMarketPlace();

    if (isAndroid()) {
      const url = await web.element(by.web.id("main")).getCurrentUrl();
      const expectedUrl = "https://shop.ledger.com/";

      jestExpect(url).toContain(expectedUrl);
    } else {
      console.warn("Skipping webview check on iOS");
    }
  });
});
