import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "helpers/allure/allure-helper";

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

const CURRENCY = Currency.BTC;

setTeamOwner(Team.WALLET_XP);
describe("Wallet 4.0 - Market Banner", () => {
  testConfig.tmsLinks.forEach(link => $TmsLink(link));
  testConfig.tags.forEach(tag => $Tag(tag));

  beforeAll(async () => {
    await app.init({
      userdata: "1AccountBTC1AccountETHReadOnlyFalse",
    });
    await app.wallet40Drawers.closeWallet40BlockingDrawersIfVisible(10_000);
    await app.mainNavigation.waitForWallet40Ready();
    await app.wallet40Drawers.closeWallet40BlockingDrawersIfVisible();
  });

  it("should display and interact with market banner", async () => {
    await app.portfolio.expectMarketBannerVisible();

    await app.portfolio.expectFearAndGreedCardVisible();
    await app.portfolio.tapFearAndGreedCard();
    await app.portfolio.expectFearAndGreedTitleInDrawer();
    await app.portfolio.closeBottomSheet();

    await app.portfolio.tapMarketBannerTile(0);
    await app.market.expectAssetPageVisible();
    await app.market.leaveAssetPage();

    await app.portfolio.expectMarketBannerVisible();
    await app.portfolio.tapMarketBannerTitle();
    await app.market.expectMarketRowTitle(CURRENCY);
    await app.market.goBackToPortfolio();

    await app.portfolio.expectMarketBannerVisible();
    await app.portfolio.swipeMarketBannerToViewAll();
    await app.portfolio.tapMarketBannerViewAll();
    await app.market.expectMarketRowTitle(CURRENCY);

    await app.market.expectFiltersVisible();

    await app.market.openAssetPage(CURRENCY);
    await app.market.starFavoriteCoin();
    await app.market.backToAssetList();
    await app.market.filterStaredAsset();
    await app.market.expectMarketRowTitle(CURRENCY);
  });
});
