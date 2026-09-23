import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

// Two apps are seeded so the assertions tell a targeted uninstall from a full wipe.
test.describe("My Ledger — uninstall an app", () => {
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    teamOwner: Team.WALLET_XP,
    mockDeviceParams: {
      apps: [{ name: AppInfos.BITCOIN.name }, { name: AppInfos.ETHEREUM.name }],
    },
  });

  test(
    "User can uninstall an app that has no dependency",
    {
      tag: ["@myLedger", ...DEVICE_TAGS],
      annotation: { type: "TMS", description: "B2CQA-782" },
    },
    async ({ app }) => {
      await app.mainNavigation.openMyLedger();
      await app.myLedger.waitForDashboard();

      await app.myLedger.openInstalledAppsTab();
      await app.myLedger.expectAppInstalled(AppInfos.BITCOIN);
      await app.myLedger.expectAppInstalled(AppInfos.ETHEREUM);

      await app.myLedger.uninstallApp(AppInfos.BITCOIN);
      await app.myLedger.expectAppInstalled(AppInfos.ETHEREUM);

      // The row leaves the installed list, so the install button only returns in the catalog.
      await app.myLedger.openCatalogTab();
      await app.myLedger.searchCatalog(AppInfos.BITCOIN.name);
      await app.myLedger.expectAppUninstalled(AppInfos.BITCOIN);
    },
  );
});
