// Skipped: the standalone Market screen pins its search header under a
// transparent nav header, so detox's strict tap on "search-box" fails in this
// legacy mock suite. Market search is covered by e2e/mobile (wallet 4.0).
// We'll revisit these if needed — they're likely to be replaced by the
// non-mocked smoke tests.
describe.skip("Market page for user with no device", () => {
  const ticker = "ETH";

  beforeAll(async () => {
    await app.init({ userdata: "1accountEth" });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  $TmsLink("B2CQA-1880");
  it("should find the researched crypto", async () => {
    await app.market.openViaDeeplink();
    await app.market.searchAsset("eth");
    await app.market.expectMarketRowTitle(ticker);
  });

  $TmsLink("B2CQA-1879");
  it("should filter starred asset in the list", async () => {
    await app.market.openAssetPage(ticker);
    await app.market.starFavoriteCoin();
    await app.market.backToAssetList();
    await app.market.filterStaredAsset();
    await app.market.expectMarketRowTitle(ticker);
  });
});
