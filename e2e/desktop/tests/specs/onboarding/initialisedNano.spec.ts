import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { deviceWithButtonTags } from "tests/utils/tagsUtils";
import { FF_DEVICE_ONBOARDING } from "tests/utils/featureFlagUtils";
import { FRESH_INSTALL_SETTINGS } from "tests/utils/userdata";

const ONBOARDING_TAGS = ["@onboarding", ...deviceWithButtonTags()];

test.describe(`Onboarding an initialised Nano (mock server)`, () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    featureFlags: {
      ...FF_DEVICE_ONBOARDING,
      lwdOnboardingCounterfeitWarning: { enabled: true },
    },
    settings: FRESH_INSTALL_SETTINGS,
    mockDeviceParams: { onboarded: true },
  });

  test(
    `Initialised Nano connects without being asked to set up or restore a seed`,
    {
      tag: ONBOARDING_TAGS,
      // TODO: find correct Xray id
      annotation: { type: "TMS", description: "B2CQA-XXX" },
    },
    async ({ app, mockDevice }) => {
      await app.onboarding.waitForLaunch();
      await app.onboarding.getStarted();
      await app.onboarding.acceptAnalytics();
      await app.portfolio.startConnectDeviceFlow();
      await app.onboarding.selectDevice(mockDevice.modelId);
      await app.onboarding.expectUseCaseScreen();

      await app.onboarding.connectInitializedDevice();
      await app.onboarding.continuePastCounterfeitWarning();
      await app.onboarding.runGenuineCheck();
      await app.onboarding.continueTutorial("genuine-check");

      await app.portfolio.expectPortfolioEmptyState();
      await app.postOnboarding.expectActions(mockDevice.modelId);
    },
  );
});
