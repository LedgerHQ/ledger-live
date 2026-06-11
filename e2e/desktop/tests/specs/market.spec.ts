import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

test.describe("Market", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "speculos-tests-app",
  });

  test(
    "Filters behavior",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
      annotation: {
        type: "TMS",
        description: "B2CQA-4315, B2CQA-4316, B2CQA-1879",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.marketBanner.clickExploreMarketHeader();
      await app.market.validateMarketList();

      await app.market.starCoin(Account.BTC_NATIVE_SEGWIT_1.currency.ticker);
      await app.market.expectFilterDropdownToBeVisible();
      await app.market.selectStarredAssetsFilter();
      await app.market.expectCoinToBeVisible(Account.BTC_NATIVE_SEGWIT_1.currency.ticker);
      await app.market.expectCoinToNotBeVisible(Account.ETH_1.currency.ticker);
    },
  );
});
