describe("Market page for user with no device", () => {
  const ticker = "ETH";

  beforeAll(async () => {
    await app.init({ userdata: "1accountEth" });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  it("should find the researched crypto", async () => {
    await app.walletTabNavigator.navigateToMarket();
    await app.market.searchAsset("eth");
    await app.market.expectMarketRowTitle(ticker);
  });

  it("should filter starred asset in the list", async () => {
    await app.market.openAssetPage(ticker);
    await app.market.starFavoriteCoin();
    await app.market.backToAssetList();
    await app.market.filterStaredAsset();
    await app.market.expectMarketRowTitle(ticker);
  });

  it("should redirect to the buy a nano marketplace page", async () => {
    await app.market.openAssetPage(ticker);
    await app.market.buyAsset();
    /*  Todo: Fix webview check tests
        await app.buyDevice.buyNano();
        await app.buyDevice.expectBuyNanoWebPage();
    */
  });
});
