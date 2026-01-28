import { test } from "tests/fixtures/common";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";

test.describe("Market", () => {
  test.use({
    //todo:  remove feature flag when market banner is enabled for all users
    userdata: "speculos-tests-app",
    featureFlags: {
      lwdWallet40: {
        enabled: true,
        params: {
          marketBanner: true,
        },
      },
    },
  });

  test(
    "Market list content",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
      annotation: {
        type: "TMS",
        description: "B2CQA-4316",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.marketBanner.clickExploreMarketHeader();
      await app.market.validateMarketList();
    },
  );

  test.only(
    "Filters behavior",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
      annotation: {
        type: "TMS",
        description: "B2CQA-4315",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.marketBanner.clickExploreMarketHeader();

      await app.market.validateMarketList();

      await app.market.starCoin("btc");
      await app.market.expectFilterDropdownToBeVisible();
      await app.market.selectStarredAssetsFilter();
      await app.market.expectCoinToBeVisible("btc");
      await app.market.expectCoinToNotBeVisible("eth");
    },
  );
});
