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

      await app.mainNavigation.openTargetFromMainNavigation("portfolio");
      await app.mainNavigation.validateTargetFromMainNavigation("portfolio");
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.mainNavigation.validateTargetFromMainNavigation("accounts");
      await app.mainNavigation.openTargetFromMainNavigation("swap");
      await app.mainNavigation.validateTargetFromMainNavigation("swap");
      await app.mainNavigation.openTargetFromMainNavigation("earn");
      await app.mainNavigation.validateTargetFromMainNavigation("earn");
      await app.mainNavigation.openTargetFromMainNavigation("discover");
      await app.mainNavigation.validateTargetFromMainNavigation("discover");
      await app.mainNavigation.openTargetFromMainNavigation("refer a friend");
      await app.mainNavigation.validateTargetFromMainNavigation("refer a friend");

      await app.mainNavigation.openTargetFromMainNavigation("card");
      await app.mainNavigation.openNotificationCenter();
      await app.mainNavigation.clickActivityIndicator();
      await app.mainNavigation.openSettings();
    },
  );
});
