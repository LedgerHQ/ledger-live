import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { deviceWithButtonTags } from "tests/utils/tagsUtils";
import { FF_DEVICE_ONBOARDING } from "tests/utils/featureFlagUtils";
import { FRESH_INSTALL_SETTINGS } from "tests/utils/userdata";

const ONBOARDING_TAGS = ["@onboarding", ...deviceWithButtonTags()];

test.describe("Restoring a Nano from a recovery phrase (mock server)", () => {
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
    `Nano is restored from an existing recovery phrase`,
    {
      tag: ONBOARDING_TAGS,
      annotation: { type: "TMS", description: "B2CQA-656" },
    },
    async ({ app, mockDevice }) => {
      await app.onboarding.waitForLaunch();
      await app.onboarding.getStarted();
      await app.onboarding.acceptAnalytics();
      await app.portfolio.startConnectDeviceFlow();
      await app.onboarding.selectDevice(mockDevice.modelId);
      await app.onboarding.expectUseCaseScreen();

      await app.onboarding.restoreWithRecoveryPhrase();
      await app.onboarding.continuePastCounterfeitWarning();

      await app.onboarding.continueTutorial("import-your-recovery-phrase");
      await app.onboarding.goBackAndContinue({
        screen: "device-how-to-2",
        previousScreen: "import-your-recovery-phrase",
      });
      await app.onboarding.continueTutorial("device-how-to-2");

      await app.onboarding.expectTutorialContinueDisabled("pin-code");
      await app.onboarding.acceptPrivatePinCode();
      await app.onboarding.continueTutorial("pin-code");
      await app.onboarding.goBackAndContinue({
        screen: "pin-code-how-to",
        previousScreen: "pin-code",
      });
      await app.onboarding.continueTutorial("pin-code-how-to");
      await app.onboarding.continuePinDrawer();

      await app.onboarding.expectTutorialContinueDisabled("existing-recovery-phrase");
      await app.onboarding.acceptRecoveryPhraseLoss();
      await app.onboarding.continueTutorial("existing-recovery-phrase");
      await app.onboarding.continueTutorial("recovery-how-to");
      await app.onboarding.goBackAndContinue({
        screen: "recovery-how-to-2",
        previousScreen: "recovery-how-to",
      });
      await app.onboarding.continueTutorial("recovery-how-to-2");
      await app.onboarding.continueRecoverySeedDrawer();

      await app.onboarding.runGenuineCheck();
      await app.onboarding.continueTutorial("genuine-check");

      await app.portfolio.expectPortfolioEmptyState();
      await app.postOnboarding.expectActions(mockDevice.modelId);
    },
  );
});
