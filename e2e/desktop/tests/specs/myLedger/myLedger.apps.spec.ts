import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

// `installedApps` looks the hash up per device, so this one follows the nightly rotation
// rather than pinning a model the way a session snapshot does.
test.describe("My Ledger — installed apps, any device", () => {
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    teamOwner: Team.WALLET_XP,
    installedApps: [AppInfos.BITCOIN],
  });

  test(
    "User can uninstall every app from My Ledger",
    {
      tag: ["@myLedger", ...DEVICE_TAGS],
      annotation: { type: "TMS", description: "B2CQA-785" },
    },
    async ({ app }) => {
      await app.mainNavigation.openMyLedger();
      await app.myLedger.waitForDashboard();

      await app.myLedger.openInstalledAppsTab();
      await app.myLedger.expectAppInstalled(AppInfos.BITCOIN);

      await app.myLedger.uninstallAllApps();
      await app.myLedger.expectNoAppsInstalled();
    },
  );
});
