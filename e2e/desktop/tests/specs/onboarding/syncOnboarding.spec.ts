import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { addTmsLink, getDescription } from "tests/utils/allureUtils";
import { deviceWithScreenTags } from "tests/utils/tagsUtils";

test.describe(`Onboarding (mock server)`, () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    mockDeviceParams: { onboarded: false },
  });

  test(
    `Unseeded device onboards through in fresh Ledger Live instance`,
    {
      tag: ["@onboarding", ...deviceWithScreenTags()],
      annotation: { type: "TMS", description: "B2CQA-1866" },
    },
    async ({ app, mockDevice }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.onboarding.waitForLaunch();
      await app.onboarding.getStarted();
      await app.portfolio.startConnectDeviceFlow();
      await app.onboarding.selectDevice(mockDevice.modelId);
      await app.syncOnboarding.expectCompanionReached(mockDevice.modelId);

      await app.syncOnboarding.runGenuineCheck();
      await app.syncOnboarding.expectDeviceGenuine();
      await app.syncOnboarding.expectOsUpToDate();

      await app.syncOnboarding.continueToSetup();
      await app.syncOnboarding.expectNewSeedPath();
      await app.syncOnboarding.skipWalletSync();
      await app.syncOnboarding.expectSetupComplete();
      await app.syncOnboarding.expectOnboardingComplete();

      await app.syncOnboarding.declineFunding();
      await app.syncOnboarding.expectCompletionScreen(mockDevice.modelId);
      await app.portfolio.waitForPortfolioEmptyState();
    },
  );
});
