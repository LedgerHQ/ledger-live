import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { deviceTagsWithoutLNS } from "tests/utils/tagsUtils";

// getDeviceNameMaxLength caps names at 17 characters on every model except nanoX from 2.2.0,
// so the new name is kept well inside that floor.
const RENAMED = "QAA Renamed";

// isEditDeviceNameSupported excludes nanoS, so the LNS tag is dropped from this spec.
test.describe("My Ledger — rename the device", () => {
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    teamOwner: Team.WALLET_XP,
  });

  test(
    "User can rename the device from My Ledger",
    {
      tag: ["@myLedger", ...deviceTagsWithoutLNS()],
      annotation: { type: "TMS", description: "B2CQA-2594" },
    },
    async ({ app, mockDevice }) => {
      await app.mainNavigation.openMyLedger();
      await app.myLedger.waitForDashboard();

      await app.myLedger.expectDeviceName(mockDevice.name);
      await app.myLedger.renameDevice(RENAMED);
      await app.myLedger.expectDeviceName(RENAMED);
    },
  );
});
