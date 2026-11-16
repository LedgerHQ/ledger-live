import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

test.describe("Main navigation", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "1AccountSOL0Balance",
  });

  test(
    "Top and main navigation entries open the expected sections",
    {
      tag: [...DEVICE_TAGS],
      annotation: {
        type: "TMS",
        description: "B2CQA-4386, B2CQA-4384, B2CQA-1837",
      },
    },
    async ({ app }) => {
      await app.mainNavigation.openNotificationCenter();
      await app.mainNavigation.clickActivityIndicator();
      await app.mainNavigation.openMyLedger();
      await app.mainNavigation.openSettings();

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.mainNavigation.validateTargetFromMainNavigation("home");
      await app.mainNavigation.openDeeplink("ledgerwallet://discover");
      await app.mainNavigation.validateTargetFromMainNavigation("discover");
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
});
