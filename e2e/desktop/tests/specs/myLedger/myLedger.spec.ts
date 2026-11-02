import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { OUTDATED_OS_VERSION_BY_MODEL } from "@ledgerhq/live-e2e-shared/enum/OsVersion";
import { getSpeculosModel } from "@ledgerhq/live-e2e-shared/speculosAppVersion";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

test.describe("My Ledger (mock server)", () => {
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    teamOwner: Team.MY_LEDGER_ONBOARDING,
    mockDeviceParams: { firmware_version: OUTDATED_OS_VERSION_BY_MODEL[getSpeculosModel()] },
  });

  test(
    "User can access My Ledger",
    {
      tag: ["@myLedger", ...DEVICE_TAGS],
      annotation: { type: "TMS", description: "B2CQA-657, B2CQA-290" },
    },
    async ({ app }) => {
      await app.mainNavigation.openMyLedger();
      await app.myLedger.waitForDashboard();
      await app.myLedger.updateFirmware();
    },
  );
});
