import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { deviceTagsWithoutLNS } from "tests/utils/tagsUtils";

// The drawer keys its options by the language id, while the trigger renders the localized label.
const TARGET_LANGUAGE = "french";
const TARGET_LABEL = "Français";
const DEFAULT_LABEL = "English";

// isDeviceLocalizationSupported has no range for nanoS, so the LNS tag is dropped.
test.describe("My Ledger — device language", () => {
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    teamOwner: Team.WALLET_XP,
  });

  test(
    "User can change the device language from My Ledger",
    {
      tag: ["@myLedger", ...deviceTagsWithoutLNS()],
      annotation: { type: "TMS", description: "B2CQA-1025" },
    },
    async ({ app, mockServer }) => {
      await app.mainNavigation.openMyLedger();
      await app.myLedger.waitForDashboard();

      await app.myLedger.expectDeviceLanguage(DEFAULT_LABEL);
      await app.myLedger.changeDeviceLanguage(TARGET_LANGUAGE);
      await app.myLedger.expectDeviceLanguage(TARGET_LABEL);

      await mockServer.expectDeviceLanguage(TARGET_LANGUAGE);
    },
  );
});
