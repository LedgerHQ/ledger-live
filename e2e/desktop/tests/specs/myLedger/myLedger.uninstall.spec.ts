import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

// Two apps are seeded so the assertions tell a targeted uninstall from a full wipe.
test.describe("My Ledger — device information and uninstall", () => {
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    teamOwner: Team.MY_LEDGER_ONBOARDING,
    mockDeviceParams: {
      apps: [{ name: AppInfos.BITCOIN.name }, { name: AppInfos.ETHEREUM.name }],
    },
  });

  test(
    "User can check the device information and uninstall an app from My Ledger",
    {
      tag: ["@myLedger", ...DEVICE_TAGS],
      annotation: { type: "TMS", description: "B2CQA-2522, B2CQA-782" },
    },
    async ({ app, mockDevice, mockServer }) => {
      await app.mainNavigation.openMyLedger();
      await app.myLedger.waitForDashboard();

      await app.myLedger.expectDeviceSummary(mockDevice.name!);
      await app.myLedger.expectStorageSummary(2);

      await app.myLedger.openInstalledAppsTab();
      await app.myLedger.expectAppInstalled(AppInfos.BITCOIN);
      await app.myLedger.expectAppInstalled(AppInfos.ETHEREUM);

      await app.myLedger.uninstallApp(AppInfos.BITCOIN);
      await app.myLedger.expectAppInstalled(AppInfos.ETHEREUM);

      // The row leaves the installed list, so the install button only returns in the catalog.
      await app.myLedger.openCatalogTab();
      await app.myLedger.searchCatalog(AppInfos.BITCOIN.name);
      await app.myLedger.expectAppUninstalled(AppInfos.BITCOIN);

      await mockServer.expectInstalledApps([AppInfos.ETHEREUM.name]);
    },
  );
});
