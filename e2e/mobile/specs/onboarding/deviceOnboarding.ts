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
import { overrideUserId } from "@e2e/bridge/server";
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
    if (options.osUpdateAvailable) await overrideUserId(FIXED_ROLLOUT_USER_ID);
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

const describeSeededFunnel = describeIfNotNanoS;

function tagSeededFunnelScenario(tmsLinks: string[], tags: string[]) {
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
}

/** The Connect screen never goes idle on iOS, so the tap that opens it would never return. */
async function openConnectScreen() {
  await app.common.disableSynchronizationForiOS();
  await app.onboarding.selectStartingOption("accessWallet");
}

async function connectDevice() {
  await app.deviceOnboarding.connect.expectDeviceListed();
  await app.deviceOnboarding.connect.selectDevice();
  await app.deviceOnboarding.checks.expectIdle();
}

async function enterFunnelFromReadOnlyPortfolio() {
  await app.onboarding.waitForOnboardingToLoad();
  await app.onboarding.tapOnGetStartedButton();
  await app.onboarding.waitForAnalyticsButtonToBeVisible();
  await app.onboarding.acceptAnalytics();
  await app.portfolio.expectReadOnlyPortfolioVisible();
  await app.portfolio.tapConnectButton();
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
    tagSeededFunnelScenario(tmsLinks, tags);

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
      tagSeededFunnelScenario(tmsLinks, tags);

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
    tagSeededFunnelScenario(tmsLinks, tags);

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
    tagSeededFunnelScenario(tmsLinks, tags);

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
    tagSeededFunnelScenario(tmsLinks, tags);

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
    tagSeededFunnelScenario(tmsLinks, tags);

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
    tagSeededFunnelScenario(tmsLinks, tags);

    it("Hands the offered OS update over to the firmware update screen", async () => {
      await enterFunnelFromReadOnlyPortfolio();
      await app.deviceOnboarding.checks.start();
      await app.deviceOnboarding.firmwareUpdateOfferDrawer.expectVisible();
      await app.deviceOnboarding.firmwareUpdateOfferDrawer.accept();
      await app.deviceOnboarding.firmwareUpdate.expectVisible();
    });
  });
}
