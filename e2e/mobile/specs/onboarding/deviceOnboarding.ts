import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { deviceUnderTest } from "@ledgerhq/live-e2e-shared/mockServer/devices";
import {
  disposeMockServerSession,
  provisionMockServerSession,
} from "@ledgerhq/live-e2e-shared/mockServer/session";
import {
  getDeviceFirmwareVersion,
  getPreviousFirmwareVersion,
} from "@ledgerhq/live-e2e-shared/speculosAppVersion";
import { device } from "detox";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { launchApp } from "@e2e/helpers/commonHelpers";
import { MockServerDevicePage } from "@e2e/page/mockServerDevice.page";
import type { PartialFeatures } from "@shared/feature-flags";

/** The OS update offered depends on the user id rollout; a fixed id keeps it the same on every run. */
const OS_UPDATE_ROLLOUT_USER_ID = "e2e-seeded-device-onboarding";

type SeededFunnelOptions = {
  /** `null` is a fresh install, which reaches the portfolio in read-only mode. */
  userdata: string | null;
  offerLedgerSync?: boolean;
  /** Opens Get Started from My Ledger, the only entry an onboarded instance has. */
  unifiedEntryPoints?: boolean;
  osUpdateAvailable?: boolean;
  featureFlags?: PartialFeatures;
};

function seededFunnelFlags({
  offerLedgerSync = true,
  unifiedEntryPoints = false,
  featureFlags = {},
}: SeededFunnelOptions): PartialFeatures {
  return {
    deviceOnboarding: {
      enabled: true,
      params: {
        connectSeededDevice: true,
        connectUnseededDevice: false,
        offerLedgerSync,
        unifiedEntryPoints,
      },
    },
    lwmNotificationsOptIn: { enabled: false },
    recoverUpsellPostOnboarding: { enabled: false },
    ...featureFlags,
  };
}

/** Plugs a seeded mock server device into a relaunched app and disposes it after the file. */
function setupSeededFunnel(options: SeededFunnelOptions): () => MockServerDevicePage {
  let mockServer: MockServerDevicePage | undefined;
  let session: { baseUrl: string; token: string } | undefined;

  beforeAll(async () => {
    const { modelId, apps: _noApps, ...deviceConfig } = deviceUnderTest();
    const firmware = options.osUpdateAvailable
      ? await getPreviousFirmwareVersion(modelId, OS_UPDATE_ROLLOUT_USER_ID)
      : await getDeviceFirmwareVersion(modelId);
    session = await provisionMockServerSession([{ ...deviceConfig, firmware_version: firmware }]);
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
    await app.init({ userdata: options.userdata, featureFlags: seededFunnelFlags(options) });
  });

  afterAll(async () => {
    if (!session) return;
    try {
      await disposeMockServerSession(session.baseUrl, session.token);
    } catch {
      // The session expires on its own. A failed dispose must not hide the spec result.
    }
  });

  return () => {
    if (!mockServer) throw new Error("The mock server session is not provisioned");
    return mockServer;
  };
}

function tagSeededFunnelScenario(tmsLinks: string[], tags: string[]) {
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
}

async function connectDevice() {
  await app.onboarding.expectStartingOptionsVisible();
  // The funnel polls the mock server transport, so iOS never goes idle from here on.
  await app.common.disableSynchronizationForiOS();
  await app.onboarding.selectStartingOption("accessWallet");
  await app.deviceOnboarding.expectConnectScreen();
  await app.deviceOnboarding.selectDevice();
  await app.deviceOnboarding.expectChecksIdle();
}

async function enterFunnelFromReadOnlyPortfolio() {
  await app.onboarding.waitForOnboardingToLoad();
  await app.onboarding.tapOnGetStartedButton();
  await app.onboarding.waitForAnalyticsButtonToBeVisible();
  await app.onboarding.acceptAnalytics();
  await app.portfolio.expectReadOnlyPortfolioVisible();
  await app.portfolio.tapConnectButton();
  await connectDevice();
}

async function enterFunnelFromMyLedger() {
  await app.mainNavigation.waitForWallet40Ready();
  await app.mainNavigation.openMyWallet();
  await app.deviceOnboarding.tapAddDevice();
  await connectDevice();
}

async function completeChecks() {
  await app.deviceOnboarding.expectChecksSucceeded();
  await app.deviceOnboarding.continueAfterChecks();
}

async function passChecks() {
  await app.deviceOnboarding.startChecks();
  await completeChecks();
}

/** Leaving read-only mode sends the user to the post-onboarding hub first. */
async function expectOnboardedFromReadOnly() {
  await app.postOnboardingHub.expectHubOpen();
  await app.postOnboardingHub.closeHub();
  await app.portfolio.expectSignerPortfolioVisible();
}

export function runSkipSyncAtFirstLaunchTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describe("Seeded device onboarding - skip Ledger Sync at first launch", () => {
    setupSeededFunnel({ userdata: null });
    tagSeededFunnelScenario(tmsLinks, tags);

    it("Connects a seeded device, skips Ledger Sync and lands on the post-onboarding", async () => {
      await enterFunnelFromReadOnlyPortfolio();
      await passChecks();
      await app.deviceOnboarding.expectSyncOffer();
      await app.deviceOnboarding.skipSync();
      await expectOnboardedFromReadOnly();
    });
  });
}

export function runSkipSyncFromOnboardedInstanceTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describe("Seeded device onboarding - skip Ledger Sync from an onboarded instance", () => {
    setupSeededFunnel({ userdata: "skip-onboarding", unifiedEntryPoints: true });
    tagSeededFunnelScenario(tmsLinks, tags);

    it("Adds a seeded device from My Ledger and goes back to the wallet", async () => {
      await enterFunnelFromMyLedger();
      await passChecks();
      await app.deviceOnboarding.expectSyncOffer();
      await app.deviceOnboarding.skipSync();
      await app.deviceOnboarding.expectSyncOfferClosed();
      await app.postOnboardingHub.expectHubNotOpen();
    });
  });
}

export function runNoSyncOfferTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describe("Seeded device onboarding - no Ledger Sync offer", () => {
    setupSeededFunnel({ userdata: null, offerLedgerSync: false });
    tagSeededFunnelScenario(tmsLinks, tags);

    it("Completes the onboarding right after the checks", async () => {
      await enterFunnelFromReadOnlyPortfolio();
      await passChecks();
      await expectOnboardedFromReadOnly();
    });
  });
}

export function runQuitBeforeChecksTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describe("Seeded device onboarding - quit before the checks", () => {
    setupSeededFunnel({ userdata: null });
    tagSeededFunnelScenario(tmsLinks, tags);

    it("Leaves the funnel without completing the onboarding", async () => {
      await enterFunnelFromReadOnlyPortfolio();
      await app.deviceOnboarding.quitChecks();
      await app.deviceOnboarding.leaveFromQuitConfirmation();
      await app.deviceOnboarding.expectChecksClosed();
      await app.onboarding.expectStartingOptionsVisible();
    });
  });
}

export function runQuitSyncOfferTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describe("Seeded device onboarding - quit the Ledger Sync offer", () => {
    setupSeededFunnel({ userdata: null });
    tagSeededFunnelScenario(tmsLinks, tags);

    it("Completes the onboarding when the offer is closed", async () => {
      await enterFunnelFromReadOnlyPortfolio();
      await passChecks();
      await app.deviceOnboarding.expectSyncOffer();
      await app.deviceOnboarding.quitSyncOffer();
      await expectOnboardedFromReadOnly();
    });
  });
}

export function runSkipOsUpdateTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describe("Seeded device onboarding - skip the OS update", () => {
    setupSeededFunnel({ userdata: null, osUpdateAvailable: true });
    tagSeededFunnelScenario(tmsLinks, tags);

    it("Skips the offered OS update and completes the onboarding", async () => {
      await enterFunnelFromReadOnlyPortfolio();
      await app.deviceOnboarding.startChecks();
      await app.deviceOnboarding.expectFirmwareUpdateOffer();
      await app.deviceOnboarding.dismissFirmwareUpdateOffer();
      await app.deviceOnboarding.skipFirmwareUpdate();
      await app.deviceOnboarding.expectChecksSucceeded();
      await app.deviceOnboarding.continueAfterChecks();
      await app.deviceOnboarding.expectSyncOffer();
      await app.deviceOnboarding.skipSync();
      await expectOnboardedFromReadOnly();
    });
  });
}

export function runAcceptOsUpdateTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describe("Seeded device onboarding - accept the OS update", () => {
    setupSeededFunnel({ userdata: null, osUpdateAvailable: true });
    tagSeededFunnelScenario(tmsLinks, tags);

    it("Hands the offered OS update over to the firmware update screen", async () => {
      await enterFunnelFromReadOnlyPortfolio();
      await app.deviceOnboarding.startChecks();
      await app.deviceOnboarding.expectFirmwareUpdateOffer();
      await app.deviceOnboarding.acceptFirmwareUpdate();
      await app.deviceOnboarding.expectFirmwareUpdateScreen();
    });
  });
}
