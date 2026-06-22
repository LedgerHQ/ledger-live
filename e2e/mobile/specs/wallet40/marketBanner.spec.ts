import { WALLET_40_FEATURE_FLAGS } from "../../utils/constants";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";

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

setTeamOwner(Team.WALLET_XP);
describe("Wallet 4.0 - Market Banner", () => {
  testConfig.tmsLinks.forEach(link => $TmsLink(link));
  testConfig.tags.forEach(tag => $Tag(tag));

  beforeAll(async () => {
    await app.init({
      userdata: "1AccountBTC1AccountETHReadOnlyFalse",
      //todo: remove feature flag when market banner is enabled for all users
      featureFlags: WALLET_40_FEATURE_FLAGS,
    });
    await app.mainNavigation.waitForWallet40Ready();
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
