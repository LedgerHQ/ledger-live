import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "helpers/allure/allure-helper";
import { FF_LWM_WALLET_40_Q2 } from "utils/featureFlagUtils";

const TAGS = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];

// The Wallet 4.0 market & global-search screens run continuous animations, so Detox
// never reaches idle (iOS) and matchers time out. Disable synchronization once for the
// whole suite (same approach as the swap specs).
beforeAll(async () => {
  await app.common.disableSynchronizationForiOS();
});

afterEach(async () => {
  await app.portfolio.openViaDeeplink();
});

setTeamOwner(Team.WALLET_XP);
describe("Wallet 4.0 Q2 - Asset discoverability - Stocks empty discovery state", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "1AccountBTC1AccountETHReadOnlyFalse",
      featureFlags: FF_LWM_WALLET_40_Q2,
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  $TmsLink("B2CQA-5955");
  TAGS.forEach(tag => $Tag(tag));

  it("should explore the stocks market from the empty stocks category", async () => {
    await app.portfolio.checkStocksDiscoverySectionVisible();

    await app.portfolio.tapStocksExploreAll();

    await app.market.expectCategorySelected("stocks");
  });
});

setTeamOwner(Team.WALLET_XP);
describe("Wallet 4.0 Q2 - Asset discoverability - Stocks holdings", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: Account.ETH_1.currency.speculosApp,
      cliCommands: [liveDataCommand(Account.ETH_1)],
      featureFlags: FF_LWM_WALLET_40_Q2,
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  $TmsLink("B2CQA-5956");
  TAGS.forEach(tag => $Tag(tag));

  it("should open the stocks assets page from the stocks category title", async () => {
    await app.portfolio.checkStocksHoldingsSectionVisible();

    await app.portfolio.tapStocksSectionTitle();

    await app.portfolio.checkStocksListPageVisible();
  });
});

setTeamOwner(Team.WALLET_XP);
describe("Wallet 4.0 Q2 - Asset discoverability - Global search categories", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding-with-last-seen-device",
      featureFlags: FF_LWM_WALLET_40_Q2,
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  $TmsLink("B2CQA-5957");
  TAGS.forEach(tag => $Tag(tag));

  it("should navigate to the markets from the search categories", async () => {
    await app.topBarSearch.open();
    await app.topBarSearch.expectCategoriesVisible();
    await app.topBarSearch.selectCryptosCategory();
    await app.market.expectCategorySelected("all");

    await app.market.goBack();
    await app.topBarSearch.expectCategoriesVisible();
    await app.topBarSearch.selectStocksCategory();
    await app.market.expectCategorySelected("stocks");
  });
});

setTeamOwner(Team.WALLET_XP);
describe("Wallet 4.0 Q2 - Asset discoverability - Global search ranking", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding-with-last-seen-device",
      featureFlags: FF_LWM_WALLET_40_Q2,
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  $TmsLink("B2CQA-5958");
  TAGS.forEach(tag => $Tag(tag));

  it("should match the typed ticker to the top search result", async () => {
    await app.topBarSearch.open();

    await app.topBarSearch.searchFor(Currency.BTC.ticker.toLowerCase());
    await app.topBarSearch.expectFirstResult(Currency.BTC.id);

    await app.topBarSearch.clearSearch();
    await app.topBarSearch.searchFor(Currency.ETH.ticker.toLowerCase());
    await app.topBarSearch.expectFirstResult(Currency.ETH.id);
  });
});
