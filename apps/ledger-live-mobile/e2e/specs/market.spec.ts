import { expect } from "detox";
import PortfolioPage from "../models/wallet/portfolioPage";
import MarketPage from "../models/market/marketPage";
import GetDevicePage from "../models/discover/getDevicePage";
import { loadConfig } from "../bridge/server";
import { getElementByText, itifAndroid } from "../helpers";

let portfolioPage: PortfolioPage;
let marketPage: MarketPage;
let getDevicePage: GetDevicePage;

describe("Market page for user with no device", () => {
  beforeAll(async () => {
    loadConfig("1accountEth", true);
    portfolioPage = new PortfolioPage();
    marketPage = new MarketPage();
    getDevicePage = new GetDevicePage();
  });

  it("should find the researched crypto", async () => {
    await portfolioPage.waitForPortfolioPageToLoad();
    await portfolioPage.openMarketPage();
    await marketPage.searchAsset("btc");
    await expect(getElementByText("Bitcoin (BTC)")).toBeVisible();
  });

  it("should filter starred asset in the list", async () => {
    await marketPage.openAssetPage("Bitcoin (BTC)");
    await marketPage.starFavoriteCoin();
    await marketPage.backToAssetList();
    await marketPage.filterStaredAsset();
    await expect(getElementByText("Bitcoin (BTC)")).toBeVisible();
  });

  // WebView check only available on Android
  itifAndroid("should redirect to the buy a nano marketplace page", async () => {
    await marketPage.openAssetPage("Bitcoin (BTC)");
    await marketPage.buyAsset();
    await getDevicePage.buyNano();
    await getDevicePage.expectBuyNanoWebPage();
  });
});
