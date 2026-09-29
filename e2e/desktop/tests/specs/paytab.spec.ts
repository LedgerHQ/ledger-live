import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { FF_LWD_CONTACTS, FF_LWD_PAY_TAB } from "tests/utils/featureFlagUtils";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

// Proves the Baanx client and token injection work; not a Pay tab UI assertion yet.
test.describe("Pay tab", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "portfolioWithManyStablecoins",
    injectCardSession: true,
    featureFlags: {
      ...FF_LWD_PAY_TAB,
      ...FF_LWD_CONTACTS,
    },
  });

  test(
    "Pay tab opens with a funded stablecoin balance and its action tiles",
    {
      tag: [...DEVICE_TAGS],
    },
    async ({ app }) => {
      await app.mainNavigation.openTargetFromMainNavigation("pay");

      await app.payTab.expectFundedBalance();
      await app.payTab.expectMoreButton();
    },
  );
});
