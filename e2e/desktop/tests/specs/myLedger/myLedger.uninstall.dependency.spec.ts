import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

// Ethereum is the only parent app in the catalog. Ethereum Classic is one of its 76 children,
// and Bitcoin is seeded as an unrelated app that the cascade must leave alone.
test.describe("My Ledger — uninstall an app with dependents", () => {
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    teamOwner: Team.WALLET_XP,
    mockDeviceParams: {
      apps: [
        { name: AppInfos.ETHEREUM.name },
        { name: AppInfos.ETHEREUM_CLASSIC.name },
        { name: AppInfos.BITCOIN.name },
      ],
    },
  });

  test(
    "User can uninstall an app that other apps depend on",
    {
      tag: ["@myLedger", ...DEVICE_TAGS],
      annotation: { type: "TMS", description: "B2CQA-783" },
    },
    async ({ app }) => {
      await app.mainNavigation.openMyLedger();
      await app.myLedger.waitForDashboard();

      await app.myLedger.openInstalledAppsTab();
      await app.myLedger.expectAppInstalled(AppInfos.ETHEREUM);
      await app.myLedger.expectAppInstalled(AppInfos.ETHEREUM_CLASSIC);
      await app.myLedger.expectAppInstalled(AppInfos.BITCOIN);

      await app.myLedger.uninstallAppWithDependents(AppInfos.ETHEREUM);

      await app.myLedger.expectAppInstalled(AppInfos.BITCOIN);

      await app.myLedger.openCatalogTab();
      await app.myLedger.searchCatalog(AppInfos.ETHEREUM.name);
      await app.myLedger.expectAppUninstalled(AppInfos.ETHEREUM);
      await app.myLedger.expectAppUninstalled(AppInfos.ETHEREUM_CLASSIC);
    },
  );
});
