import { Application } from "../page";

let app: Application;
const asset = "Ethereum (ETH)";

describe("Market page for user with no device", () => {
  beforeAll(async () => {
    app = await Application.init({ userdata: "1accountEth" });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  $TmsLink("B2CQA-1880");
  it("should find the researched crypto", async () => {
    await app.walletTabNavigator.navigateToMarket();
    await app.market.searchAsset("eth");
    await app.market.expectMarketRowTitle(asset);
  });

  $TmsLink("B2CQA-1879");
  it("should filter starred asset in the list", async () => {
    await app.market.openAssetPage(asset);
    await app.market.starFavoriteCoin();
    await app.market.backToAssetList();
    await app.market.filterStaredAsset();
    await app.market.expectMarketRowTitle(asset);
  });

  $TmsLink("B2CQA-1881");
  it("should redirect to the buy a nano marketplace page", async () => {
    await app.market.openAssetPage(asset);
    await app.market.buyAsset();
    /*  Todo: Fix webview check tests
        await app.buyDevice.buyNano();
        await app.buyDevice.expectBuyNanoWebPage();
    */
  });
});
