import { test } from "tests/fixtures/common";
import { expect } from "@playwright/test";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { LWD_WALLET_40_Q2_FF_ENABLED } from "tests/utils/featureFlagUtils";
import { liveDataCommand } from "@ledgerhq/live-common/e2e/cliCommandsUtils";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

const deviceTags = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];

test.describe("Stocks - empty discovery state", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "1AccountBTC1AccountETH",
    featureFlags: LWD_WALLET_40_Q2_FF_ENABLED,
  });

  test(
    "Explore stocks market from empty stocks category",
    {
      tag: deviceTags,
      annotation: {
        type: "TMS",
        description: "B2CQA-5955",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.portfolio.expectStocksDiscoveryVisible();

      await app.portfolio.clickStocksExploreAll();

      await app.market.expectMarketPageVisible();
      await app.market.expectCategorySelected("stocks");
    },
  );
});

test.describe("Stocks - holdings", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: Account.ETH_1.currency.speculosApp,
    cliCommands: [liveDataCommand(Account.ETH_1)],
    featureFlags: LWD_WALLET_40_Q2_FF_ENABLED,
  });

  test(
    "Open stocks assets page from stocks category",
    {
      tag: deviceTags,
      annotation: {
        type: "TMS",
        description: "B2CQA-5956",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.portfolio.expectStocksHoldingsVisible();

      await app.portfolio.clickStocksSectionTitle();

      await expect(app.layout.getPage()).toHaveURL(/\/assets\?category=stocks/);
      await expect(app.assets.cryptoAssetPageContent).toBeVisible();
    },
  );
});

test.describe("Stocks - global search", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
    featureFlags: LWD_WALLET_40_Q2_FF_ENABLED,
  });

  test(
    "Navigate to markets from search categories",
    {
      tag: deviceTags,
      annotation: {
        type: "TMS",
        description: "B2CQA-5957",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.topBarSearch.open();
      await app.topBarSearch.expectCategoriesVisible();

      await app.topBarSearch.selectCryptosCategory();
      await app.market.expectMarketPageVisible();
      await app.market.expectCategorySelected("all");

      await app.topBarSearch.open();
      await app.topBarSearch.selectStocksCategory();
      await app.market.expectMarketPageVisible();
      await app.market.expectCategorySelected("stocks");
    },
  );

  test(
    "Match ticker to top search result",
    {
      tag: deviceTags,
      annotation: {
        type: "TMS",
        description: "B2CQA-5958",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.topBarSearch.open();

      await app.topBarSearch.searchFor("btc");
      await app.topBarSearch.expectFirstResultTicker("btc");

      await app.topBarSearch.clearSearch();
      await app.topBarSearch.searchFor("eth");
      await app.topBarSearch.expectFirstResultTicker("eth");
    },
  );
});
