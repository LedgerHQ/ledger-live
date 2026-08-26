import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import {
  FF_LWD_CONTACTS,
  FF_LWD_PAY_TAB,
  FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
} from "tests/utils/featureFlagUtils";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

/**
 * Suite: Pay tab
 *
 * Opens the Pay tab on a portfolio that holds stablecoins and asserts the funded balance hero.
 *
 * The fixture matters: the action tiles render only inside the funded state, and `hasBalance` is
 * `stablecoins.some(({ value }) => value > 0)`. A portfolio without stablecoin holdings shows the
 * empty state and no tiles, so `portfolioWithManyStablecoins` is what makes this assertable.
 *
 * Nothing here signs in to the Card. The balance hero reads the local portfolio, not Baanx, so the
 * funded state and the tiles do not depend on a Card session.
 */

test.describe("Pay tab", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "portfolioWithManyStablecoins",
    featureFlags: {
      // Contacts are only reachable with My Wallet on, which is a `lwdWallet40` param rather than a
      // flag of its own. The NO_ANALYTICS_CONSENT variant also suppresses the "Help us improve
      // Ledger" dialog, which would otherwise sit over the sidebar on landing.
      ...FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
      ...FF_LWD_PAY_TAB,
      ...FF_LWD_CONTACTS,
    },
  });

  test(
    "Pay tab opens with a funded stablecoin balance and its action tiles",
    {
      tag: [...DEVICE_TAGS],
      annotation: {
        type: "TMS",
        // TODO: replace with a real Xray ticket before merging.
        description: "B2CQA-0000",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("pay");

      await app.payTab.waitForBalance();
      await app.payTab.expectFundedBalance();
      await app.payTab.expectActionTiles();
    },
  );
});
