import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { deviceWithScreenTags } from "tests/utils/tagsUtils";

// isCustomLockScreenSupported is limited to Stax, Flex and Nano Gen5.
test.describe("My Ledger — remove custom lock screen", () => {
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    teamOwner: Team.MY_LEDGER_ONBOARDING,
  });

  test(
    "User can remove a custom lock screen from My Ledger",
    {
      tag: ["@myLedger", ...deviceWithScreenTags()],
      annotation: { type: "TMS", description: "B2CQA-1926" },
    },
    async ({ app, mockServer }) => {
      await mockServer.mockCustomLockScreenPresent();
      await app.mainNavigation.openMyLedger();
      await app.myLedger.waitForDashboard();

      await app.myLedger.expectCustomLockScreenAction("Change");
      await app.myLedger.removeCustomLockScreen();
      await app.myLedger.expectCustomLockScreenRemoved();
      await app.myLedger.closeCustomLockScreenRemoval();
      await app.myLedger.expectCustomLockScreenAction("Add");
    },
  );
});
