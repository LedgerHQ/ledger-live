import path from "path";
import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { deviceWithScreenTags } from "tests/utils/tagsUtils";

const LOCK_SCREEN_IMAGE = path.resolve(__dirname, "custom-lock-screen.png");

// isCustomLockScreenSupported is limited to Stax, Flex and Nano Gen5.
test.describe("My Ledger — custom lock screen", () => {
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    teamOwner: Team.WALLET_XP,
  });

  test(
    "User can configure a custom lock screen from My Ledger",
    {
      tag: ["@myLedger", ...deviceWithScreenTags()],
      annotation: { type: "TMS", description: "B2CQA-2589" },
    },
    async ({ app }) => {
      await app.mainNavigation.openMyLedger();
      await app.myLedger.waitForDashboard();

      await app.myLedger.expectCustomLockScreenAction("Add");
      await app.myLedger.setCustomLockScreen(LOCK_SCREEN_IMAGE);
      await app.myLedger.expectCustomLockScreenAction("Change");
    },
  );
});
