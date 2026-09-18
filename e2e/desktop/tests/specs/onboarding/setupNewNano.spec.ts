import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { deviceWithButtonTags } from "tests/utils/tagsUtils";
import { ONBOARDING_STEP } from "@ledgerhq/live-e2e-shared/mockServer/onboardingFlags";

test.describe(`Onboarding a new Nano (mock server)`, () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    mockDeviceParams: { onboarded: false },
  });

  test(
    `Factory Nano is set up as a new device`,
    {
      tag: ["@onboarding", ...deviceWithButtonTags()],
      annotation: { type: "TMS", description: "B2CQA-725" },
    },
    async ({ app, mockDevice, mockServer }) => {
      await app.onboarding.waitForLaunch();
      await app.onboarding.getStarted();
      await app.portfolio.checkConnectButtonVisibility();

      await app.portfolio.startConnectDeviceFlow();
      await app.onboarding.expectDeviceSelectionScreen();

      await app.onboarding.selectDevice(mockDevice.modelId);
      await app.onboarding.expectUseCaseScreen();

      await app.onboarding.setUpNewDevice();
      await app.onboarding.completePedagogy();
      await app.onboarding.completeTutorialSteps();
      await app.onboarding.completeQuiz();
      await app.onboarding.continueTutorial();

      await mockServer.pinOnboardingStep(ONBOARDING_STEP.ready, true);
      await app.onboarding.runGenuineCheck();
      await app.onboarding.continueTutorial();

      await app.onboarding.continueTutorialSecondary(); // skip Ledger Sync
      await app.onboarding.continueTutorialSecondary(); // skip funding
      await app.onboarding.continueTutorial();

      await app.portfolio.waitForPortfolioEmptyState();
    },
  );
});
