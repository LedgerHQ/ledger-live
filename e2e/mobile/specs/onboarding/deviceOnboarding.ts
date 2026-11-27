import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { deviceUnderTest } from "@ledgerhq/live-e2e-shared/mockServer/devices";
import { ONBOARDING_STEP } from "@ledgerhq/live-e2e-shared/mockServer/onboardingFlags";
import {
  disposeMockServerSession,
  provisionMockServerSession,
} from "@ledgerhq/live-e2e-shared/mockServer/session";
import {
  getLatestFirmwareVersion,
  getPreviousFirmwareVersion,
} from "@ledgerhq/live-e2e-shared/speculosAppVersion";
import { device } from "detox";
import { overrideUserId } from "@e2e/bridge/server";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { describeIfNotNanoS, launchApp } from "@e2e/helpers/commonHelpers";
import { MockServerDevicePage } from "@e2e/page/mockServerDevice.page";
import type { PartialFeatures } from "@shared/feature-flags";

const FIXED_ROLLOUT_USER_ID = "e2e-seeded-device-onboarding";

type SeededFunnelOptions = {
  userdata: string | null;
  offerLedgerSync?: boolean;
  /** Opens Get Started from My Ledger, the only entry an onboarded instance has. */
  unifiedEntryPoints?: boolean;
  osUpdateAvailable?: boolean;
};

function seededFunnelFlags({
  offerLedgerSync = true,
  unifiedEntryPoints = false,
}: SeededFunnelOptions): PartialFeatures {
  return {
    deviceOnboarding: {
      enabled: true,
      params: {
        connectSeededDevice: true,
        connectUnseededDevice: false,
        offerLedgerSync,
        unifiedEntryPoints,
        recover: true,
      },
    },
    lwmNotificationsOptIn: { enabled: false },
    recoverUpsellPostOnboarding: { enabled: false },
  };
}

type UnseededFunnelOptions = {
  counterfeitWarning?: boolean;
  offerLedgerSync?: boolean;
  recoverPitch?: boolean;
  recoverDetailsSheet?: boolean;
};

function unseededFunnelFlags({
  counterfeitWarning = false,
  offerLedgerSync = false,
  recoverPitch = false,
  recoverDetailsSheet = false,
}: UnseededFunnelOptions): PartialFeatures {
  return {
    deviceOnboarding: {
      enabled: true,
      params: {
        connectSeededDevice: false,
        connectUnseededDevice: true,
        offerLedgerSync,
        unifiedEntryPoints: false,
      },
    },
    lwmOnboardingCounterfeitWarning: { enabled: counterfeitWarning },
    protectServicesMobile: { enabled: recoverPitch },
    recoverDetailedDrawerOnboarding: { enabled: recoverDetailsSheet },
    lwmNotificationsOptIn: { enabled: false },
    recoverUpsellPostOnboarding: { enabled: false },
  };
}

type FunnelSetup = {
  userdata: string | null;
  featureFlags: PartialFeatures;
  osUpdateAvailable?: boolean;
  unseededDevice?: boolean;
};

/** Boots the app on a mock server device and returns the handle that drives that device. */
function setupFunnel(options: FunnelSetup): () => MockServerDevicePage {
  let session: { baseUrl: string; token: string } | undefined;
  let mockServer: MockServerDevicePage | undefined;

  beforeAll(async () => {
    const { modelId, apps: _noApps, ...deviceConfig } = deviceUnderTest();
    const firmware = options.osUpdateAvailable
      ? await getPreviousFirmwareVersion(modelId, FIXED_ROLLOUT_USER_ID)
      : await getLatestFirmwareVersion(modelId);
    session = await provisionMockServerSession([
      {
        ...deviceConfig,
        firmware_version: firmware,
        ...(options.unseededDevice ? { onboarded: false } : {}),
      },
    ]);
    mockServer = new MockServerDevicePage(session.baseUrl, session.token);

    const port = await launchApp({
      newInstance: true,
      launchArgs: {
        mockServerUrl: session.baseUrl,
        mockServerToken: session.token,
        mockServerModel: modelId,
      },
    });
    await device.reverseTcpPort(port);
    await app.init({ userdata: options.userdata, featureFlags: options.featureFlags });
    if (options.osUpdateAvailable) await overrideUserId(FIXED_ROLLOUT_USER_ID);
  });

  afterAll(async () => {
    if (!session) return;
    try {
      await disposeMockServerSession(session);
    } catch {
      // The session expires on its own. A failed dispose must not hide the spec result.
    }
  });

  return () => {
    if (!mockServer) throw new Error("The mock server session is not provisioned yet");
    return mockServer;
  };
}

function setupSeededFunnel(options: SeededFunnelOptions): void {
  setupFunnel({
    userdata: options.userdata,
    featureFlags: seededFunnelFlags(options),
    osUpdateAvailable: options.osUpdateAvailable,
  });
}

const describeSeededFunnel = describeIfNotNanoS;
const describeUnseededFunnel = describeIfNotNanoS;

function tagFunnelScenario(tmsLinks: string[], tags: string[]) {
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
}

/** The Connect screen never goes idle on iOS, so the tap that opens it would never return. */
async function openConnectScreen(option: "setupLedger" | "accessWallet" = "accessWallet") {
  await app.common.disableSynchronizationForiOS();
  await app.onboarding.selectStartingOption(option);
}

async function connectDevice() {
  await app.deviceOnboarding.connect.expectDeviceListed();
  await app.deviceOnboarding.connect.selectDevice();
  await app.deviceOnboarding.checks.expectIdle();
}

async function openStartingOptionsFromColdStart() {
  await app.onboarding.waitForOnboardingToLoad();
  await app.onboarding.tapOnGetStartedButton();
  await app.onboarding.waitForAnalyticsButtonToBeVisible();
  await app.onboarding.acceptAnalytics();
  await app.portfolio.expectReadOnlyPortfolioVisible();
  await app.portfolio.tapConnectButton();
}

async function enterFunnelFromReadOnlyPortfolio() {
  await openStartingOptionsFromColdStart();
  await openConnectScreen();
  await connectDevice();
}

async function enterFunnelFromMyLedger() {
  await app.mainNavigation.waitForWallet40Ready();
  await app.mainNavigation.openMyWallet();
  await app.myWallet.tapAddDevice();
  await openConnectScreen();
  await connectDevice();
}

async function passChecks() {
  await app.deviceOnboarding.checks.start();
  await app.deviceOnboarding.checks.expectSucceeded();
  await app.deviceOnboarding.checks.continueAfterSuccess();
}

async function skipLedgerSync() {
  await app.deviceOnboarding.syncOffer.skip();
  await app.deviceOnboarding.skipSyncDrawer.confirm();
}

async function expectOnboardedFromReadOnly() {
  await app.postOnboardingHub.expectHubOpen();
  await app.postOnboardingHub.closeHub();
  await app.portfolio.expectSignerPortfolioVisible();
}

export function runSkipSyncAtFirstLaunchTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describeSeededFunnel("Seeded device onboarding - skip Ledger Sync at first launch", () => {
    setupSeededFunnel({ userdata: null });
    tagFunnelScenario(tmsLinks, tags);

    it("Connects a seeded device, skips Ledger Sync and lands on the post-onboarding", async () => {
      await enterFunnelFromReadOnlyPortfolio();
      await passChecks();
      await app.deviceOnboarding.syncOffer.expectVisible();
      await skipLedgerSync();
      await expectOnboardedFromReadOnly();
    });
  });
}

export function runSkipSyncFromOnboardedInstanceTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describeSeededFunnel(
    "Seeded device onboarding - skip Ledger Sync from an onboarded instance",
    () => {
      setupSeededFunnel({ userdata: "skip-onboarding", unifiedEntryPoints: true });
      tagFunnelScenario(tmsLinks, tags);

      it("Adds a seeded device from My Ledger and goes back to the wallet", async () => {
        await enterFunnelFromMyLedger();
        await passChecks();
        await app.deviceOnboarding.syncOffer.expectVisible();
        await skipLedgerSync();
        await app.deviceOnboarding.syncOffer.expectClosed();
        await app.mainNavigation.waitForWallet40Ready();
        await app.postOnboardingHub.expectHubNotOpen();
      });
    },
  );
}

export function runNoSyncOfferTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describeSeededFunnel("Seeded device onboarding - no Ledger Sync offer", () => {
    setupSeededFunnel({ userdata: null, offerLedgerSync: false });
    tagFunnelScenario(tmsLinks, tags);

    it("Completes the onboarding right after the checks", async () => {
      await enterFunnelFromReadOnlyPortfolio();
      await passChecks();
      await app.postOnboardingHub.expectHubOpen();
      await app.deviceOnboarding.syncOffer.expectNotShown();
      await expectOnboardedFromReadOnly();
    });
  });
}

export function runQuitBeforeChecksTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describeSeededFunnel("Seeded device onboarding - quit before the checks", () => {
    setupSeededFunnel({ userdata: null });
    tagFunnelScenario(tmsLinks, tags);

    it("Leaves the funnel without completing the onboarding", async () => {
      await enterFunnelFromReadOnlyPortfolio();
      await app.deviceOnboarding.checks.quit();
      await app.deviceOnboarding.quitConfirmationDrawer.leave();
      await app.deviceOnboarding.checks.expectClosed();
      await app.onboarding.expectStartingOptionsVisible();
    });
  });
}

export function runQuitSyncOfferTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describeSeededFunnel("Seeded device onboarding - quit the Ledger Sync offer", () => {
    setupSeededFunnel({ userdata: null });
    tagFunnelScenario(tmsLinks, tags);

    it("Completes the onboarding when the offer is closed", async () => {
      await enterFunnelFromReadOnlyPortfolio();
      await passChecks();
      await app.deviceOnboarding.syncOffer.expectVisible();
      await app.deviceOnboarding.syncOffer.quit();
      await expectOnboardedFromReadOnly();
    });
  });
}

export function runSkipOsUpdateTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describeSeededFunnel("Seeded device onboarding - skip the OS update", () => {
    setupSeededFunnel({ userdata: null, osUpdateAvailable: true });
    tagFunnelScenario(tmsLinks, tags);

    it("Skips the offered OS update and completes the onboarding", async () => {
      await enterFunnelFromReadOnlyPortfolio();
      await app.deviceOnboarding.checks.start();
      await app.deviceOnboarding.firmwareUpdateOfferDrawer.expectVisible();
      await app.deviceOnboarding.firmwareUpdateOfferDrawer.dismiss();
      await app.deviceOnboarding.checks.skipFirmwareUpdate();
      await app.deviceOnboarding.checks.expectSucceeded();
      await app.deviceOnboarding.checks.continueAfterSuccess();
      await app.deviceOnboarding.syncOffer.expectVisible();
      await skipLedgerSync();
      await expectOnboardedFromReadOnly();
    });
  });
}

export function runAcceptOsUpdateTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describeSeededFunnel("Seeded device onboarding - accept the OS update", () => {
    setupSeededFunnel({ userdata: null, osUpdateAvailable: true });
    tagFunnelScenario(tmsLinks, tags);

    it("Hands the offered OS update over to the firmware update screen", async () => {
      await enterFunnelFromReadOnlyPortfolio();
      await app.deviceOnboarding.checks.start();
      await app.deviceOnboarding.firmwareUpdateOfferDrawer.expectVisible();
      await app.deviceOnboarding.firmwareUpdateOfferDrawer.accept();
      await app.deviceOnboarding.firmwareUpdate.expectVisible();
    });
  });
}

function setupUnseededFunnel(options: UnseededFunnelOptions = {}): () => MockServerDevicePage {
  return setupFunnel({
    userdata: null,
    featureFlags: unseededFunnelFlags(options),
    unseededDevice: true,
  });
}

async function connectUnseededDevice() {
  await app.deviceOnboarding.connect.expectDeviceListed();
  await app.deviceOnboarding.connect.selectDevice();
  await app.deviceOnboarding.introKaraoke.expectVisible();
}

async function reachUnseededIntroAction() {
  await openStartingOptionsFromColdStart();
  await openConnectScreen("setupLedger");
  await connectUnseededDevice();
  await app.deviceOnboarding.introKaraoke.readUntilAction();
}

async function startUnseededSetup() {
  await reachUnseededIntroAction();
  await app.deviceOnboarding.introKaraoke.start();
}

async function passUnseededChecks() {
  await app.deviceOnboarding.setup.expectChecksSucceeded();
}

async function createPin(mockServer: MockServerDevicePage) {
  await mockServer.moveToOnboardingStep(ONBOARDING_STEP.pin);
  await app.deviceOnboarding.setup.expectStage("pin");
}

async function chooseToRestore(mockServer: MockServerDevicePage) {
  await mockServer.moveToOnboardingStep(ONBOARDING_STEP.setupChoice);
  await app.deviceOnboarding.setup.expectStage("setupChoice");
  await mockServer.moveToOnboardingStep(ONBOARDING_STEP.setupChoiceRestore);
  await app.deviceOnboarding.setup.expectStage("restore");
}

async function generateNewSeed(mockServer: MockServerDevicePage) {
  await mockServer.moveToOnboardingStep(ONBOARDING_STEP.newDevice);
  await app.deviceOnboarding.setup.expectStage("security");
}

async function finishSetupOnDevice(mockServer: MockServerDevicePage) {
  await mockServer.moveToOnboardingStep(ONBOARDING_STEP.ready, true);
}

async function setUpNewSeedOnDevice(mockServer: MockServerDevicePage) {
  await startUnseededSetup();
  await passUnseededChecks();
  await createPin(mockServer);
  await generateNewSeed(mockServer);
  await finishSetupOnDevice(mockServer);
}

async function reachRestoreChoice(mockServer: MockServerDevicePage) {
  await startUnseededSetup();
  await passUnseededChecks();
  await createPin(mockServer);
  await chooseToRestore(mockServer);
}

async function restoreWithRecoveryPhraseOnDevice(mockServer: MockServerDevicePage) {
  await mockServer.moveToOnboardingStep(ONBOARDING_STEP.restoreSeed);
  await app.deviceOnboarding.setup.expectRecoveryPhraseRestore();
  await finishSetupOnDevice(mockServer);
}

async function restoreWithRecoveryKeyOnDevice(mockServer: MockServerDevicePage) {
  await mockServer.moveToOnboardingStep(ONBOARDING_STEP.restoreCharon);
  await finishSetupOnDevice(mockServer);
}

async function finishRestoreFromSuccessKaraoke() {
  await app.deviceOnboarding.successKaraoke.expectVisible();
  await app.deviceOnboarding.successKaraoke.finishFromAction();
  await expectOnboardedFromReadOnly();
}

export function runUnseededNewSeedTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describeUnseededFunnel("Unseeded device onboarding - new seed", () => {
    const mockServer = setupUnseededFunnel();
    tagFunnelScenario(tmsLinks, tags);

    it("Sets up a factory device from Set up your Ledger and lands on the portfolio", async () => {
      await setUpNewSeedOnDevice(mockServer());
      await app.deviceOnboarding.successKaraoke.expectVisible();
      await app.deviceOnboarding.successKaraoke.readToEnd();
      await expectOnboardedFromReadOnly();
    });
  });
}

export function runUnseededCounterfeitWarningTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describeUnseededFunnel("Unseeded device onboarding - counterfeit warning", () => {
    const mockServer = setupUnseededFunnel({ counterfeitWarning: true });
    tagFunnelScenario(tmsLinks, tags);

    it("Acknowledges the counterfeit warning, sets up a new seed and lands on the portfolio", async () => {
      await reachUnseededIntroAction();
      await app.deviceOnboarding.introKaraoke.start();
      await app.deviceOnboarding.counterfeitWarningDrawer.expectVisible();
      await app.deviceOnboarding.counterfeitWarningDrawer.proceed();
      await passUnseededChecks();
      await createPin(mockServer());
      await generateNewSeed(mockServer());
      await finishSetupOnDevice(mockServer());
      await app.deviceOnboarding.successKaraoke.expectVisible();
      await app.deviceOnboarding.successKaraoke.readToEnd();
      await expectOnboardedFromReadOnly();
    });
  });
}

export function runUnseededSkipSyncTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describeUnseededFunnel("Unseeded device onboarding - skip Ledger Sync", () => {
    const mockServer = setupUnseededFunnel({ offerLedgerSync: true });
    tagFunnelScenario(tmsLinks, tags);

    it("Skips the Ledger Sync offer after a new seed and lands on the portfolio", async () => {
      await setUpNewSeedOnDevice(mockServer());
      await app.deviceOnboarding.syncOffer.expectVisible();
      await skipLedgerSync();
      await app.deviceOnboarding.syncOffer.expectClosed();
      await app.deviceOnboarding.successKaraoke.expectVisible();
      await app.deviceOnboarding.successKaraoke.readToEnd();
      await expectOnboardedFromReadOnly();
    });
  });
}

export function runUnseededQuitSyncOfferTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describeUnseededFunnel("Unseeded device onboarding - quit the Ledger Sync offer", () => {
    const mockServer = setupUnseededFunnel({ offerLedgerSync: true });
    tagFunnelScenario(tmsLinks, tags);

    it("Closes the Ledger Sync offer after a new seed and lands on the portfolio", async () => {
      await setUpNewSeedOnDevice(mockServer());
      await app.deviceOnboarding.syncOffer.expectVisible();
      await app.deviceOnboarding.syncOffer.quit();
      await app.deviceOnboarding.syncOffer.expectClosed();
      await app.deviceOnboarding.successKaraoke.expectVisible();
      await app.deviceOnboarding.successKaraoke.readToEnd();
      await expectOnboardedFromReadOnly();
    });
  });
}

export function runUnseededSkipRecoverTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describeUnseededFunnel("Unseeded device onboarding - skip the Recover offer", () => {
    const mockServer = setupUnseededFunnel({ recoverPitch: true });
    tagFunnelScenario(tmsLinks, tags);

    it("Skips the Recover offer after a new seed and lands on the portfolio", async () => {
      await setUpNewSeedOnDevice(mockServer());
      await app.deviceOnboarding.recoverNewSeed.expectVisible();
      await app.deviceOnboarding.recoverNewSeed.readUntilOffer();
      await app.deviceOnboarding.recoverNewSeed.skip();
      await app.deviceOnboarding.recoverNewSeed.expectClosed();
      await app.deviceOnboarding.successKaraoke.expectVisible();
      await app.deviceOnboarding.successKaraoke.readToEnd();
      await expectOnboardedFromReadOnly();
    });
  });
}

export function runUnseededRemindRecoverLaterTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describeUnseededFunnel("Unseeded device onboarding - remind me later about Recover", () => {
    const mockServer = setupUnseededFunnel({ recoverPitch: true, recoverDetailsSheet: true });
    tagFunnelScenario(tmsLinks, tags);

    it("Defers Recover from its details after a new seed and lands on the portfolio", async () => {
      await setUpNewSeedOnDevice(mockServer());
      await app.deviceOnboarding.recoverNewSeed.expectVisible();
      await app.deviceOnboarding.recoverNewSeed.readUntilOffer();
      await app.deviceOnboarding.recoverNewSeed.openDetails();
      await app.deviceOnboarding.recoverDetailsDrawer.expectVisible();
      await app.deviceOnboarding.recoverDetailsDrawer.remindLater();
      await app.deviceOnboarding.recoverNewSeed.expectClosed();
      await app.deviceOnboarding.successKaraoke.expectVisible();
      await app.deviceOnboarding.successKaraoke.readToEnd();
      await expectOnboardedFromReadOnly();
    });
  });
}

export function runUnseededRestorePhraseTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describeUnseededFunnel("Unseeded device onboarding - restore with a recovery phrase", () => {
    const mockServer = setupUnseededFunnel();
    tagFunnelScenario(tmsLinks, tags);

    it("Restores a factory device with its recovery phrase and lands on the portfolio", async () => {
      await reachRestoreChoice(mockServer());
      await restoreWithRecoveryPhraseOnDevice(mockServer());
      await finishRestoreFromSuccessKaraoke();
    });
  });
}

export function runUnseededRestoreRecoverTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describeUnseededFunnel("Unseeded device onboarding - restore from Recover", () => {
    const mockServer = setupUnseededFunnel();
    tagFunnelScenario(tmsLinks, tags);

    it("Closes the Recover restore screen, restores with a recovery phrase and lands on the portfolio", async () => {
      await reachRestoreChoice(mockServer());
      await mockServer().moveToOnboardingStep(ONBOARDING_STEP.recoverRestore);
      await app.deviceOnboarding.recoverRestore.expectVisible();
      await app.deviceOnboarding.recoverRestore.close();
      await app.deviceOnboarding.recoverRestore.expectClosed();
      await app.deviceOnboarding.setup.expectStage("restore");
      await restoreWithRecoveryPhraseOnDevice(mockServer());
      await finishRestoreFromSuccessKaraoke();
    });
  });
}

export function runUnseededRestoreRecoveryKeyTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describeUnseededFunnel("Unseeded device onboarding - restore with a Recovery Key", () => {
    const mockServer = setupUnseededFunnel();
    tagFunnelScenario(tmsLinks, tags);

    it("Restores a factory device with a Recovery Key and lands on the portfolio", async () => {
      await reachRestoreChoice(mockServer());
      await restoreWithRecoveryKeyOnDevice(mockServer());
      await finishRestoreFromSuccessKaraoke();
    });
  });
}
