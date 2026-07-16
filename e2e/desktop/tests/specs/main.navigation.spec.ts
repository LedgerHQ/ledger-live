import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";

const DEVICE_TAGS = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"] as const;

test.describe("Main navigation", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "1AccountSOL0Balance",
  });

  test(
    "main sidebar entries redirect to the expected sections",
    {
      tag: [...DEVICE_TAGS],
      annotation: {
        type: "TMS",
        description: "B2CQA-4384",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.mainNavigation.validateTargetFromMainNavigation("home");
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
    },
  );

  test(
    "top navigation actions open the expected sections",
    {
      tag: [...DEVICE_TAGS],
      annotation: {
        type: "TMS",
        description: "B2CQA-4386",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openNotificationCenter();
      await app.mainNavigation.clickActivityIndicator();
      await app.mainNavigation.openMyLedger();
      await app.mainNavigation.openSettings();
    },
  );
});
