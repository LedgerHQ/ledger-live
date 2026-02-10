import { test } from "tests/fixtures/common";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";

const DEVICE_TAGS = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"] as const;

test.describe("Main navigation", () => {
  test.use({
    userdata: "1AccountBTC1AccountETH",
    featureFlags: {
      lwdWallet40: {
        enabled: true,
        params: {
          marketBanner: true,
          graphRework: true,
          quickActionCtas: true,
          mainNavigation: true,
        },
      },
      referralProgramDesktopSidebar: {
        enabled: true,
        params: {
          amount: "$20",
          isNew: false,
          path: "/platform/refer-a-friend",
        },
      },
    },
  });

  test(
    "main and top navigation redirect to the expected sections",
    {
      tag: [...DEVICE_TAGS],
      annotation: {
        type: "TMS",
        description: "B2CQA-4384, B2CQA-4386",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.verifyPortfolioNavigation();
      await app.mainNavigation.verifyAccountsNavigation();
      await app.mainNavigation.verifySwapNavigation();
      await app.mainNavigation.verifyEarnNavigation();
      await app.mainNavigation.verifyDiscoverNavigation();
      await app.mainNavigation.verifyReferAFriendNavigation();
      await app.mainNavigation.verifyCardNavigation();
      await app.mainNavigation.verifyNotificationCenterNavigation();
      await app.mainNavigation.verifyActivityIndicatorNavigation();
      await app.mainNavigation.verifySettingsNavigation();
    },
  );
});
