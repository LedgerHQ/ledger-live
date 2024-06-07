import { expect } from "detox";
import { loadConfig } from "../bridge/server";
import { getElementByText } from "../helpers";
import { Application } from "../page/index";

let app: Application;

describe("Market page for user with no device", () => {
  beforeAll(async () => {
    await loadConfig("1accountEth", true);
    app = new Application();

    await app.portfolio.waitForPortfolioPageToLoad();
  });

  $TmsLink("B2CQA-1880");
  it("should find the researched crypto", async () => {
    await app.portfolio.openWalletTabMarket();
    await app.market.searchAsset("btc");
    await expect(getElementByText("Bitcoin (BTC)")).toBeVisible();
  });

  $TmsLink("B2CQA-1879");
  it("should filter starred asset in the list", async () => {
    await app.market.openAssetPage("Bitcoin (BTC)");
    await app.market.starFavoriteCoin();
    await app.market.backToAssetList();
    await app.market.filterStaredAsset();
    await expect(getElementByText("Bitcoin (BTC)")).toBeVisible();
  });

  $TmsLink("B2CQA-1881");
  it("should redirect to the buy a nano marketplace page", async () => {
    await app.market.openAssetPage("Bitcoin (BTC)");
    await app.market.buyAsset();
    await app.buyDevice.buyNano();
    await app.buyDevice.expectBuyNanoWebPage();
  });
});
