import * as detox from "detox";
import PortfolioPage from "../models/wallet/portfolioPage";
import MarketPage from "../models/market/marketPage";
import { loadConfig } from "../bridge/server";
import { isAndroid, getElementByText } from "../helpers";

let portfolioPage: PortfolioPage;
let marketPage: MarketPage;

describe("Market page for user with no device", () => {
  beforeAll(async () => {
    await loadConfig("1accountEth", true);
    portfolioPage = new PortfolioPage();
    marketPage = new MarketPage();
  });

  it("should find the researched crypto", async () => {
    // navigate to the market page
    await portfolioPage.waitForPortfolioPageToLoad();
    await portfolioPage.openMaketPage();

    // search for btc in the market list
    await marketPage.searchAsset("btc\n");

    // await expect(element(by.text("Bitcoin (BTC)"))).toBeVisible();
    await detox.expect(getElementByText("Bitcoin (BTC)")).toBeVisible();
  });

  it("should filter starred asset in the list", async () => {
    // open a crypto card and starring it
    await marketPage.openAssetPage("Bitcoin (BTC)");
    await marketPage.starFavoriteCoin();

    await marketPage.backToAssetList();

    // filter the list with the star filter
    await marketPage.filterStaredAsset();

    await detox.expect(getElementByText("Bitcoin (BTC)")).toBeVisible();
  });

  it("should redirect to the buy a nano marketplace page", async () => {
    // opening the crypto card and tapping the buy button
    await marketPage.openAssetPage("Bitcoin (BTC)");
    await marketPage.buyNano();

    // open the marketplace through the drawer
    await marketPage.openMarketPlace();

    if (isAndroid()) {
      const url = await detox.web.element(detox.by.web.id("main")).getCurrentUrl();
      // eslint-disable-next-line no-console
      console.log(url);
      await expect(url).toEqual(
        "https://shop.ledger.com/products/ledger-nano-x?utm_source=ledger_live_mobile&utm_medium=buy_from_live&apptracking=false",
      );
    } else {
      console.warn("Skipping webview check on iOS");
    }
  });
});
