import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

// The drawer keys options on the language id, while the trigger renders the localized label.
const TARGET_LANGUAGE = "french";
const TARGET_LABEL = "Français";
const DEFAULT_LABEL = "English";

test.describe("My Ledger — device language", () => {
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    teamOwner: Team.WALLET_XP,
  });

  test(
    "User can change the device language from My Ledger",
    {
      tag: ["@myLedger", ...DEVICE_TAGS],
      annotation: { type: "TMS", description: "B2CQA-1025" },
    },
    async ({ app }) => {
      await app.mainNavigation.openMyLedger();
      await app.myLedger.waitForDashboard();

      await app.myLedger.expectDeviceLanguage(DEFAULT_LABEL);
      await app.myLedger.changeDeviceLanguage(TARGET_LANGUAGE);
      await app.myLedger.expectDeviceLanguage(TARGET_LABEL);
    },
  );
});
