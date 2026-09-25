import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

test.describe("My Ledger — device information", () => {
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    teamOwner: Team.WALLET_XP,
  });

  test(
    "Device information shown on My Ledger matches the connected device",
    {
      tag: ["@myLedger", ...DEVICE_TAGS],
      annotation: { type: "TMS", description: "B2CQA-2522" },
    },
    async ({ app, mockDevice }) => {
      await app.mainNavigation.openMyLedger();
      await app.myLedger.waitForDashboard();

      await app.myLedger.expectDeviceSummary(mockDevice.name);
    },
  );
});
