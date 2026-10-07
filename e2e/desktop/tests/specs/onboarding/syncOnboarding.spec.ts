import test from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { deviceWithScreenTags } from "tests/utils/tagsUtils";
import {
  CHARON_STATUS,
  ONBOARDING_STEP,
} from "@ledgerhq/live-e2e-shared/mockServer/onboardingFlags";
import { FF_DEVICE_ONBOARDING } from "tests/utils/featureFlagUtils";
import { FRESH_INSTALL_SETTINGS } from "tests/utils/userdata";

const ONBOARDING_TAGS = ["@onboarding", ...deviceWithScreenTags()];

const FRESH_INSTALL_ONBOARDING = {
  teamOwner: Team.WALLET_XP,
  featureFlags: FF_DEVICE_ONBOARDING,
  settings: FRESH_INSTALL_SETTINGS,
};

test.describe(`Onboarding (mock server)`, () => {
  test.use({ ...FRESH_INSTALL_ONBOARDING, mockDeviceParams: { onboarded: false } });

  test(
    `Unseeded device onboards in fresh Ledger Live instance`,
    {
      tag: ONBOARDING_TAGS,
      annotation: { type: "TMS", description: "B2CQA-1866" },
    },
    async ({ app, mockDevice, mockServer }) => {
      await app.syncOnboarding.startOnboardingFromFreshInstall(mockDevice.modelId);

      await app.syncOnboarding.setUpAsNewDevice(mockServer);
      await mockServer.pinOnboardingStep(ONBOARDING_STEP.ready, true);

      await app.syncOnboarding.skipWalletSync();
      await app.syncOnboarding.expectSetupComplete();
      await app.syncOnboarding.expectOnboardingComplete();

      await app.syncOnboarding.declineFunding();
      await app.syncOnboarding.expectCompletionScreen(mockDevice.modelId);
      await app.portfolio.expectPortfolioEmptyState();
    },
  );
});

test.describe(`Connect an already initialised device`, () => {
  test.use({ ...FRESH_INSTALL_ONBOARDING, mockDeviceParams: { onboarded: true } });

  test(
    `Device connects without being asked to set up or restore a seed`,
    {
      tag: ONBOARDING_TAGS,
      annotation: { type: "TMS", description: "B2CQA-509" },
    },
    async ({ app, mockDevice }) => {
      await app.syncOnboarding.startOnboardingFromFreshInstall(mockDevice.modelId);
      await app.syncOnboarding.continueToSetup();

      await app.syncOnboarding.expectSeedStepsSkipped();

      await app.syncOnboarding.skipWalletSync();
      await app.syncOnboarding.expectSetupComplete();

      await app.syncOnboarding.expectAppInstallOffered();
      await app.syncOnboarding.declineAppInstall();

      await app.syncOnboarding.expectCompletionScreen(mockDevice.modelId);
      await app.portfolio.expectPortfolioEmptyState();
    },
  );
});

test.describe(`Restore a seed from a configured Ledger Live`, () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    featureFlags: FF_DEVICE_ONBOARDING,
    userdata: "1AccountBTC1AccountETH",
    mockDeviceParams: { onboarded: false },
  });

  test(
    `Device is restored from an existing seed without losing the Live configuration`,
    {
      tag: ONBOARDING_TAGS,
      annotation: { type: "TMS", description: "B2CQA-1867" },
    },
    async ({ app, mockDevice, mockServer }) => {
      await app.portfolio.expectBalanceVisibility();

      await app.mainNavigation.openSettings();
      await app.settings.goToHelpTab();
      await app.settings.launchOnboarding();
      await app.onboarding.selectDevice(mockDevice.modelId);
      await app.syncOnboarding.expectCompanionReached(mockDevice.modelId);

      await app.syncOnboarding.passGenuineCheck();

      await app.syncOnboarding.restoreFromSeed(mockServer);
      await mockServer.pinOnboardingStep(ONBOARDING_STEP.ready, true);

      await app.syncOnboarding.skipWalletSync();
      await app.syncOnboarding.expectSetupComplete();

      await app.syncOnboarding.expectAppRestoreOffered();
      await app.syncOnboarding.installApps();
      await app.syncOnboarding.expectCompletionScreen(mockDevice.modelId);
      await mockServer.expectInstalledApps(["Bitcoin", "Ethereum"]);
      await app.postOnboarding.closeFinishOnboardingDialog();

      await app.portfolio.expectBalanceVisibility();
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.expectAccountsCount(6);
      await app.accounts.expectCryptoAccountRowVisible("Bitcoin 1 (legacy)");
      await app.accounts.expectCryptoAccountRowVisible("Ethereum 1");

      await app.accounts.navigateToAccountByName("Ethereum 1");
      await app.account.expectAccountVisibility("Ethereum 1");
    },
  );
});

test.describe(`Back up a restored seed with a Ledger Recovery Key`, () => {
  test.use({ ...FRESH_INSTALL_ONBOARDING, mockDeviceParams: { onboarded: false } });

  test(
    `Recovery Key backup completes and the companion moves on to app installation`,
    {
      tag: ONBOARDING_TAGS,
      annotation: { type: "TMS", description: "B2CQA-3793" },
    },
    async ({ app, mockDevice, mockServer }) => {
      await app.syncOnboarding.startOnboardingFromFreshInstall(mockDevice.modelId);

      await app.syncOnboarding.restoreFromSeed(mockServer);

      await app.syncOnboarding.backUpOnRecoveryKey(mockServer);

      await app.syncOnboarding.skipWalletSync();
      await app.syncOnboarding.expectSetupComplete();
      await app.syncOnboarding.expectAppInstallOffered();
    },
  );
});

test.describe(`Restore a seed from a Ledger Recovery Key`, () => {
  test.use({ ...FRESH_INSTALL_ONBOARDING, mockDeviceParams: { onboarded: false } });

  test(
    `Unseeded device is restored from a Recovery Key and onboarding completes`,
    {
      tag: ONBOARDING_TAGS,
      annotation: { type: "TMS", description: "B2CQA-3380" },
    },
    async ({ app, mockDevice, mockServer }) => {
      await app.syncOnboarding.startOnboardingFromFreshInstall(mockDevice.modelId);
      await app.syncOnboarding.continueToSetup();

      await mockServer.pinOnboardingStep(
        ONBOARDING_STEP.setupChoiceRestore,
        false,
        CHARON_STATUS.ready,
      );
      await app.syncOnboarding.expectRestoreChoices();

      await mockServer.pinOnboardingStep(ONBOARDING_STEP.restoreCharon, false, CHARON_STATUS.ready);
      await app.syncOnboarding.expectRestoreFromRecoveryKey();

      await mockServer.pinOnboardingStep(ONBOARDING_STEP.ready, true, CHARON_STATUS.ready);

      await app.syncOnboarding.skipWalletSync();
      await app.syncOnboarding.expectSetupComplete();
      await app.syncOnboarding.expectAppInstallOffered();
      await app.syncOnboarding.declineAppInstall();
      await app.syncOnboarding.expectCompletionScreen(mockDevice.modelId);
    },
  );
});

test.describe(`Back up a newly created seed with a Ledger Recovery Key`, () => {
  test.use({ ...FRESH_INSTALL_ONBOARDING, mockDeviceParams: { onboarded: false } });

  test(
    `Recovery Key backup completes after setting the device up as new`,
    {
      tag: ONBOARDING_TAGS,
      annotation: { type: "TMS", description: "B2CQA-3372" },
    },
    async ({ app, mockDevice, mockServer }) => {
      await app.syncOnboarding.startOnboardingFromFreshInstall(mockDevice.modelId);

      await app.syncOnboarding.setUpAsNewDevice(mockServer);

      await app.syncOnboarding.backUpOnRecoveryKey(mockServer);

      await app.syncOnboarding.skipWalletSync();
      await app.syncOnboarding.expectSetupComplete();

      await app.syncOnboarding.expectOnboardingComplete();
      await app.syncOnboarding.declineFunding();
      await app.syncOnboarding.expectCompletionScreen(mockDevice.modelId);
    },
  );
});
