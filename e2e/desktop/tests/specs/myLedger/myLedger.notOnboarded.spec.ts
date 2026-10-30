import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

test.describe("My Ledger — device not set up", () => {
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    teamOwner: Team.MY_LEDGER_ONBOARDING,
    mockDeviceParams: { onboarded: false },
  });

  test(
    "User starts setting up a factory device from My Ledger",
    {
      tag: ["@myLedger", "@onboarding", ...DEVICE_TAGS],
      annotation: { type: "TMS", description: "B2CQA-6719" },
    },
    async ({ app, mockDevice }) => {
      await app.mainNavigation.openMyLedger();
      await app.myLedger.expectDeviceNotOnboarded();

      await app.myLedger.startDeviceSetup();
      await app.onboarding.expectSetupEntryScreen(mockDevice.modelId);
    },
  );
});
