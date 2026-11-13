import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { deviceTagsWithoutLNS } from "tests/utils/tagsUtils";

// getDeviceNameMaxLength allows 17 characters on nanoSP and nanoX before 2.2.0, and 20 elsewhere,
// so the new name stays below the smallest limit.
const RENAMED = "QAA Renamed";

// The drawer keys its options by the language id, while the trigger renders the localized label.
const TARGET_LANGUAGE = "german";
const TARGET_LABEL = "Deutsch";
const DEFAULT_LABEL = "English";

// isEditDeviceNameSupported excludes nanoS and isDeviceLocalizationSupported has no range for it,
// so the LNS tag is dropped from this spec.
test.describe("My Ledger — device name and language", () => {
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    teamOwner: Team.MY_LEDGER_ONBOARDING,
  });

  test(
    "User can rename the device and change its language from My Ledger",
    {
      tag: ["@myLedger", ...deviceTagsWithoutLNS()],
      annotation: { type: "TMS", description: "B2CQA-2594, B2CQA-1025" },
    },
    async ({ app, mockDevice, mockServer }) => {
      await app.mainNavigation.openMyLedger();
      await app.myLedger.waitForDashboard();

      await app.myLedger.expectDeviceName(mockDevice.name!);
      await app.myLedger.renameDevice(RENAMED);
      await app.myLedger.expectDeviceName(RENAMED);

      await mockServer.expectDeviceName(RENAMED);

      await app.myLedger.expectDeviceLanguage(DEFAULT_LABEL);
      await app.myLedger.changeDeviceLanguage(TARGET_LANGUAGE);
      await app.myLedger.expectDeviceLanguage(TARGET_LABEL);

      await mockServer.expectDeviceLanguage(TARGET_LANGUAGE);
    },
  );
});
