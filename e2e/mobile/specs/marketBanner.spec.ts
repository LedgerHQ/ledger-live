const testConfig = {
  tmsLinks: [
    "B2CQA-4302",
    "B2CQA-4321",
    "B2CQA-4325",
    "B2CQA-4318",
    "B2CQA-4316",
    "B2CQA-4324",
    "B2CQA-4320",
    "B2CQA-4315",
  ],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

const TICKER = "BTC";

describe("Market Banner", () => {
  testConfig.tmsLinks.forEach(link => $TmsLink(link));
  testConfig.tags.forEach(tag => $Tag(tag));

  beforeAll(async () => {
    await app.init({
      userdata: "speculos-subAccount",
      featureFlags: {
        //todo: remove feature flag when market banner is enabled for all users
        lwmWallet40: {
          enabled: true,
          params: { marketBanner: true, graphRework: true, quickActionCtas: true },
        },
      },
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  it("should display and interact with market banner", async () => {
    await app.portfolio.expectMarketBannerVisible();

    await app.portfolio.expectFearAndGreedCardVisible();
    await app.portfolio.tapFearAndGreedCard();
    await app.portfolio.expectFearAndGreedTitleInDrawer();
    await app.portfolio.closeBottomSheet();

    await app.portfolio.tapMarketBannerTile(0);
    await app.market.expectMarketDetailPage();
    await app.market.leaveMarketDetailPage();

    await app.portfolio.expectMarketBannerVisible();
    await app.portfolio.tapMarketBannerTitle();
    await app.market.expectMarketRowTitle(TICKER);
    await app.market.goBackToPortfolio();

    await app.portfolio.expectMarketBannerVisible();
    await app.portfolio.swipeMarketBannerToViewAll();
    await app.portfolio.tapMarketBannerViewAll();
    await app.market.expectMarketRowTitle(TICKER);

    await app.market.expectFiltersVisible();

    await app.market.openAssetPage(TICKER);
    await app.market.starFavoriteCoin();
    await app.market.backToAssetList();
    await app.market.filterStaredAsset();
    await app.market.expectMarketRowTitle(TICKER);
  });
});
