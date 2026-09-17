import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { deviceWithScreenTags } from "tests/utils/tagsUtils";

test.describe("My Ledger (mock server)", () => {
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    teamOwner: Team.WALLET_XP,
  });

  test(
    "User can access My Ledger and browse the app catalog",
    {
      tag: ["@myLedger", ...deviceWithScreenTags()],
      annotation: { type: "TMS", description: "B2CQA-657" },
    },
    async ({ app }) => {
      await app.mainNavigation.openMyLedger();
      await app.myLedger.waitForDashboard();

      await app.myLedger.openCatalogTab();
      await app.myLedger.searchCatalog(AppInfos.BITCOIN.name);
      await app.myLedger.expectAppInCatalog(AppInfos.BITCOIN);

      await app.myLedger.openInstalledAppsTab();
      await app.myLedger.expectNoAppsInstalled();
    },
  );
});
