import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { deviceUnderTest } from "@ledgerhq/live-e2e-shared/mockServer/devices";
import {
  disposeMockServerSession,
  provisionMockServerSession,
} from "@ledgerhq/live-e2e-shared/mockServer/session";
import {
  getLatestFirmwareVersion,
  getPreviousFirmwareVersion,
} from "@ledgerhq/live-e2e-shared/speculosAppVersion";
import { device } from "detox";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { describeIfNotNanoS, launchApp } from "@e2e/helpers/commonHelpers";
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
      },
    },
    lwmNotificationsOptIn: { enabled: false },
    recoverUpsellPostOnboarding: { enabled: false },
  };
}

function setupSeededFunnel(options: SeededFunnelOptions): void {
  let session: { baseUrl: string; token: string } | undefined;

  beforeAll(async () => {
    const { modelId, apps: _noApps, ...deviceConfig } = deviceUnderTest();
    const firmware = options.osUpdateAvailable
      ? await getPreviousFirmwareVersion(modelId, FIXED_ROLLOUT_USER_ID)
      : await getLatestFirmwareVersion(modelId);
    session = await provisionMockServerSession([{ ...deviceConfig, firmware_version: firmware }]);

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
}

// iOS never goes idle while the funnel listens to the mock server device.
const describeSeededFunnel = (...args: Parameters<typeof describe>) =>
  process.env.DETOX_CONFIGURATION?.startsWith("ios")
    ? describe.skip("[Android only] " + args[0], args[1])
    : describeIfNotNanoS(...args);

function tagSeededFunnelScenario(tmsLinks: string[], tags: string[]) {
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
}

async function connectDevice() {
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
  await app.onboarding.selectStartingOption("accessWallet");
  await connectDevice();
}

async function enterFunnelFromMyLedger() {
  await app.mainNavigation.waitForWallet40Ready();
  await app.mainNavigation.openMyWallet();
  await app.deviceOnboarding.tapAddDevice();
  await app.onboarding.selectStartingOption("accessWallet");
  await connectDevice();
}

async function passChecks() {
  await app.deviceOnboarding.startChecks();
  await app.deviceOnboarding.expectChecksSucceeded();
  await app.deviceOnboarding.continueAfterChecks();
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
  describeSeededFunnel(
    "Seeded device onboarding - skip Ledger Sync from an onboarded instance",
    () => {
      setupSeededFunnel({ userdata: "skip-onboarding", unifiedEntryPoints: true });
      tagSeededFunnelScenario(tmsLinks, tags);

      it("Adds a seeded device from My Ledger and goes back to the wallet", async () => {
        await enterFunnelFromMyLedger();
        await passChecks();
        await app.deviceOnboarding.expectSyncOffer();
        await app.deviceOnboarding.skipSync();
        await app.deviceOnboarding.expectSyncOfferClosed();
        await app.myWallet.expectScreenVisible();
        await app.postOnboardingHub.expectHubNotOpen();
      });
    },
  );
}

export function runNoSyncOfferTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.ENGAGEMENT);
  describeSeededFunnel("Seeded device onboarding - no Ledger Sync offer", () => {
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
  describeSeededFunnel("Seeded device onboarding - quit before the checks", () => {
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
  describeSeededFunnel("Seeded device onboarding - quit the Ledger Sync offer", () => {
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
  describeSeededFunnel("Seeded device onboarding - skip the OS update", () => {
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
  describeSeededFunnel("Seeded device onboarding - accept the OS update", () => {
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
