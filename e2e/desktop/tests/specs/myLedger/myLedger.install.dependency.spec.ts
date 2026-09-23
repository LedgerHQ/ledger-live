import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

// Ethereum Classic is one of the 76 apps whose parent is Ethereum, so installing it pulls
// Ethereum in as well.
test.describe("My Ledger — install an app with a dependency", () => {
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    teamOwner: Team.WALLET_XP,
  });

  test(
    "User can install an app that depends on another app",
    {
      tag: ["@myLedger", ...DEVICE_TAGS],
      annotation: { type: "TMS", description: "B2CQA-670" },
    },
    async ({ app }) => {
      await app.mainNavigation.openMyLedger();
      await app.myLedger.waitForDashboard();

      await app.myLedger.openInstalledAppsTab();
      await app.myLedger.expectNoAppsInstalled();

      await app.myLedger.openCatalogTab();
      await app.myLedger.searchCatalog(AppInfos.ETHEREUM_CLASSIC.name);
      await app.myLedger.installAppWithDependency(AppInfos.ETHEREUM_CLASSIC);

      await app.myLedger.openInstalledAppsTab();
      await app.myLedger.expectAppInstalled(AppInfos.ETHEREUM_CLASSIC);
      await app.myLedger.expectAppInstalled(AppInfos.ETHEREUM);
    },
  );
});
