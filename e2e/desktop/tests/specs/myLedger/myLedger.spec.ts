import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

test.describe("My Ledger (mock server)", () => {
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    teamOwner: Team.WALLET_XP,
  });

  test(
    "User can access My Ledger",
    {
      tag: ["@myLedger", ...DEVICE_TAGS],
      annotation: { type: "TMS", description: "B2CQA-657" },
    },
    async ({ app }) => {
      await app.mainNavigation.openMyLedger();
      await app.myLedger.waitForDashboard();
    },
  );
});
