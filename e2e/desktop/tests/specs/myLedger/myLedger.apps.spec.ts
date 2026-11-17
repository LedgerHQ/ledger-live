import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

// Every install starts from an empty device, so the apps are uninstalled between scenarios.
// Kaspa is in the catalog but its asset is not supported by Ledger Wallet. Support is derived
// from the currency feature flag, so the flag is pinned off rather than left to the run's default.
// Ethereum Classic is one of the 76 apps whose parent is Ethereum, so installing it pulls
// Ethereum in as well.
test.describe("My Ledger — apps", () => {
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    teamOwner: Team.MY_LEDGER_ONBOARDING,
    featureFlags: { currencyKaspa: { enabled: false } },
  });

  test(
    "User can install, browse and uninstall apps from My Ledger",
    {
      tag: ["@myLedger", ...DEVICE_TAGS],
      annotation: {
        type: "TMS",
        description: "B2CQA-664, B2CQA-784, B2CQA-785, B2CQA-669, B2CQA-670",
      },
    },
    async ({ app, mockServer }) => {
      await app.mainNavigation.openMyLedger();
      await app.myLedger.waitForDashboard();

      await app.myLedger.openInstalledAppsTab();
      await app.myLedger.expectNoAppsInstalled();
      const storageBefore = await app.myLedger.readStorage();

      await app.myLedger.openCatalogTab();
      await app.myLedger.searchCatalog(AppInfos.BITCOIN.name);
      await app.myLedger.installApp(AppInfos.BITCOIN);

      await app.myLedger.expectInstallSuccessBanner(AppInfos.BITCOIN);
      await app.myLedger.expectAddAccountOffered(AppInfos.BITCOIN);

      // The catalog never renders an uninstall button, so the install is confirmed on the other tab.
      await app.myLedger.openInstalledAppsTab();
      await app.myLedger.expectAppInstalled(AppInfos.BITCOIN);
      await app.myLedger.expectStorageSummary(1);
      await app.myLedger.expectStorageChangedFrom(storageBefore);

      await mockServer.expectInstalledApps([AppInfos.BITCOIN.name]);

      await app.myLedger.openCatalogTab();
      const everyApp = await app.myLedger.readCatalogAppNames();

      await app.myLedger.searchCatalog(AppInfos.BITCOIN.name);
      await app.myLedger.expectCatalogNarrowedTo(AppInfos.BITCOIN, everyApp);
      await app.myLedger.searchCatalog("");

      await app.myLedger.filterCatalogBy("not_installed");
      await app.myLedger.expectAppNotListed(AppInfos.BITCOIN);
      await app.myLedger.filterCatalogBy("all");
      await app.myLedger.expectAppInCatalog(AppInfos.BITCOIN);

      await app.myLedger.sortCatalogBy("name_asc");
      const ascending = await app.myLedger.expectCatalogSortedByName();
      await app.myLedger.sortCatalogBy("name_desc");
      await app.myLedger.expectCatalogReversed(ascending);

      await app.myLedger.openInstalledAppsTab();
      await app.myLedger.expectAppInstalled(AppInfos.BITCOIN);
      await app.myLedger.uninstallAllApps();
      await app.myLedger.expectNoAppsInstalled();

      await app.myLedger.openCatalogTab();
      await app.myLedger.searchCatalog(AppInfos.KASPA.name);
      await app.myLedger.expectAppNotSupported(AppInfos.KASPA);
      await app.myLedger.installApp(AppInfos.KASPA);

      await app.myLedger.openInstalledAppsTab();
      await app.myLedger.expectAppInstalled(AppInfos.KASPA);

      await mockServer.expectInstalledApps([AppInfos.KASPA.name]);

      await app.myLedger.openCatalogTab();
      await app.myLedger.searchCatalog(AppInfos.KASPA.name);
      await app.myLedger.expectLearnMoreOffered(AppInfos.KASPA);

      await app.myLedger.openInstalledAppsTab();
      await app.myLedger.uninstallAllApps();
      await app.myLedger.expectNoAppsInstalled();

      await app.myLedger.openCatalogTab();
      await app.myLedger.searchCatalog(AppInfos.ETHEREUM_CLASSIC.name);
      await app.myLedger.installAppWithDependency(AppInfos.ETHEREUM_CLASSIC, AppInfos.ETHEREUM);

      await app.myLedger.openInstalledAppsTab();
      await app.myLedger.expectAppInstalled(AppInfos.ETHEREUM_CLASSIC);
      await app.myLedger.expectAppInstalled(AppInfos.ETHEREUM);

      await mockServer.expectInstalledApps([
        AppInfos.ETHEREUM.name,
        AppInfos.ETHEREUM_CLASSIC.name,
      ]);
    },
  );
});
