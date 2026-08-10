import { test } from "tests/fixtures/common";
import { expect } from "@playwright/test";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { FF_LWD_WALLET_40_Q2 } from "tests/utils/featureFlagUtils";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

test.describe("Asset discoverability", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "1AccountBTC1AccountETH",
    featureFlags: FF_LWD_WALLET_40_Q2,
  });

  test(
    "Explore the stocks market from the empty stocks category",
    {
      tag: [...DEVICE_TAGS],
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

test.describe("Asset discoverability", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: Account.ETH_1.currency.speculosApp,
    cliCommands: [liveDataCommand(Account.ETH_1)],
    featureFlags: FF_LWD_WALLET_40_Q2,
  });

  test(
    `[${Account.ETH_1.currency.testLabel}] - Open the stocks assets page from the stocks category`,
    {
      tag: [...DEVICE_TAGS],
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
      await expect(app.portfolio.assetsView.categoryPageContent).toBeVisible();
    },
  );
});

test.describe("Asset discoverability", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
    featureFlags: FF_LWD_WALLET_40_Q2,
  });

  test(
    "Navigate to markets from the search categories",
    {
      tag: [...DEVICE_TAGS],
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
    `[${Currency.BTC.testLabel}-${Currency.ETH.testLabel}] - Match the typed ticker to the top search result`,
    {
      tag: [...DEVICE_TAGS],
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
