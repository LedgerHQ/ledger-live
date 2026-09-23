import { expect } from "@playwright/test";
import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

test.describe("My Ledger — app catalog", () => {
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    teamOwner: Team.WALLET_XP,
    mockDeviceParams: { apps: [{ name: AppInfos.BITCOIN.name }] },
  });

  test(
    "User can search, filter and sort the app catalog",
    {
      tag: ["@myLedger", ...DEVICE_TAGS],
      annotation: { type: "TMS", description: "B2CQA-784" },
    },
    async ({ app }) => {
      await app.mainNavigation.openMyLedger();
      await app.myLedger.waitForDashboard();
      await app.myLedger.openCatalogTab();

      const everyApp = await app.myLedger.listedAppNames();
      expect(everyApp.length).toBeGreaterThan(1);

      await app.myLedger.searchCatalog(AppInfos.BITCOIN.name);
      const matching = await app.myLedger.listedAppNames();
      expect(matching.length).toBeLessThan(everyApp.length);
      expect(matching).toContain(AppInfos.BITCOIN.name);
      await app.myLedger.searchCatalog("");

      await app.myLedger.filterCatalogBy("not_installed");
      expect(await app.myLedger.listedAppNames()).not.toContain(AppInfos.BITCOIN.name);
      await app.myLedger.filterCatalogBy("all");
      expect(await app.myLedger.listedAppNames()).toContain(AppInfos.BITCOIN.name);

      await app.myLedger.sortCatalogBy("name_asc");
      const ascending = await app.myLedger.listedAppNames();
      expect(ascending).toEqual(ascending.toSorted((a, b) => a.localeCompare(b)));

      await app.myLedger.sortCatalogBy("name_desc");
      expect(await app.myLedger.listedAppNames()).toEqual(ascending.toReversed());
    },
  );
});
