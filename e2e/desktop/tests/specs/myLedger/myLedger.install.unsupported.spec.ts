import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

// Kaspa is in the catalog but its asset is not supported by Ledger Wallet.
test.describe("My Ledger — install an app for an unsupported asset", () => {
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    teamOwner: Team.WALLET_XP,
  });

  test(
    "User can install an app for an asset Ledger Wallet does not support",
    {
      tag: ["@myLedger", ...DEVICE_TAGS],
      annotation: { type: "TMS", description: "B2CQA-669" },
    },
    async ({ app }) => {
      await app.mainNavigation.openMyLedger();
      await app.myLedger.waitForDashboard();

      await app.myLedger.openInstalledAppsTab();
      await app.myLedger.expectNoAppsInstalled();

      await app.myLedger.openCatalogTab();
      await app.myLedger.searchCatalog(AppInfos.KASPA.name);
      await app.myLedger.expectAppNotSupported(AppInfos.KASPA);
      await app.myLedger.installApp(AppInfos.KASPA);

      await app.myLedger.openInstalledAppsTab();
      await app.myLedger.expectAppInstalled(AppInfos.KASPA);

      await app.myLedger.openCatalogTab();
      await app.myLedger.searchCatalog(AppInfos.KASPA.name);
      await app.myLedger.expectLearnMoreOffered(AppInfos.KASPA);
    },
  );
});
