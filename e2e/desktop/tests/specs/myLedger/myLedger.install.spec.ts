import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

test.describe("My Ledger — install an app", () => {
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    teamOwner: Team.WALLET_XP,
  });

  test(
    "User can install an app for a Ledger Live supported asset",
    {
      tag: ["@myLedger", ...DEVICE_TAGS],
      annotation: { type: "TMS", description: "B2CQA-664" },
    },
    async ({ app }) => {
      await app.mainNavigation.openMyLedger();
      await app.myLedger.waitForDashboard();

      await app.myLedger.openInstalledAppsTab();
      await app.myLedger.expectNoAppsInstalled();

      await app.myLedger.openCatalogTab();
      await app.myLedger.searchCatalog(AppInfos.BITCOIN.name);
      await app.myLedger.installApp(AppInfos.BITCOIN);

      // The catalog never renders an uninstall button, so the install is confirmed on the other tab.
      await app.myLedger.openInstalledAppsTab();
      await app.myLedger.expectAppInstalled(AppInfos.BITCOIN);
    },
  );
});
