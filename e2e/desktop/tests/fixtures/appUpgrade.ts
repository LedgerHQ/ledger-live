import type { ElectronApplication, Page } from "@playwright/test";
import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";
import { test as base } from "tests/fixtures/common";
import { Application } from "tests/page";
import { captureArtifacts } from "tests/utils/allureUtils";
import { buildAppEnv } from "tests/utils/appEnvUtils";
import { closeApp, launchApp, waitForAppReady } from "tests/utils/electronUtils";
import { getMergedFeatureFlags } from "tests/utils/featureFlagUtils";
import { safeAppendFile } from "tests/utils/fileUtils";
import {
  installNightlyBuild,
  resolveNightlyVersion,
  type NightlyBuild,
} from "tests/utils/nightlyBuildUtils";

/**
 * A nightly's updater reads this feed (only non-production builds do). A closed port fails the
 * check as if offline, so the nightly does not install a newer one over the cached build on quit.
 */
const NIGHTLY_APP_ENV = { UPDATE_FEED_URL: "http://127.0.0.1:1" };

export type AppUpgrade = {
  /** Launches the previous version on the test's profile. */
  launchPreviousVersion: () => Promise<Application>;
  /** Quits the running app, as an update does, and launches the new version on the same profile. */
  upgradeToNewVersion: () => Promise<Application>;
};

type AppUpgradeFixtures = {
  /** `E2E_UPGRADE_FROM_VERSION`, or the latest published nightly. */
  upgradeFrom: NightlyBuild;
  /** `E2E_UPGRADE_TO_VERSION` when set, otherwise the local build under test. */
  upgradeTo: NightlyBuild | undefined;
  appUpgrade: AppUpgrade;
};

type RunningApp = { electronApp: ElectronApplication; page: Page };

export const test = base.extend<AppUpgradeFixtures>({
  upgradeFrom: [
    async ({}, use) => {
      const version = await resolveNightlyVersion(process.env.E2E_UPGRADE_FROM_VERSION);
      await use(await installNightlyBuild(version));
    },
    { timeout: TIMEOUT.xxxxlarge },
  ],

  upgradeTo: [
    async ({}, use) => {
      const requested = process.env.E2E_UPGRADE_TO_VERSION;
      await use(
        requested ? await installNightlyBuild(await resolveNightlyVersion(requested)) : undefined,
      );
    },
    { timeout: TIMEOUT.xxxxlarge },
  ],

  appUpgrade: async (
    { upgradeFrom, upgradeTo, userdataDestinationPath, env, featureFlags, lang, theme, speculos },
    use,
    testInfo,
  ) => {
    const upgradePath = `${upgradeFrom.version} -> ${upgradeTo?.version ?? "build under test"}`;
    if (upgradeFrom.version === upgradeTo?.version) {
      throw new Error(`Nothing to upgrade: ${upgradePath}`);
    }
    console.log(`[E2E] App upgrade: ${upgradePath}`);
    await testInfo.attach("Upgrade path", { body: upgradePath, contentType: "text/plain" });

    const mergedFeatureFlags = getMergedFeatureFlags({ testFlags: featureFlags });
    const session: { running?: RunningApp } = {};

    const launch = async (label: string, build: NightlyBuild | undefined) => {
      const electronApp = await launchApp({
        env: {
          ...buildAppEnv({
            env,
            mergedFeatureFlags,
            speculosDevice: speculos.device,
            testId: testInfo.testId,
          }),
          ...(build && NIGHTLY_APP_ENV),
        },
        lang,
        theme,
        userdataDestinationPath,
        windowSize: { width: 1024, height: 768 },
        executablePath: build?.executablePath,
      });
      const page = await electronApp.firstWindow();
      session.running = { electronApp, page };
      page.setDefaultTimeout(TIMEOUT.xlarge);
      const logFile = testInfo.outputPath(`logs-${label}.log`);
      page.on("console", msg => safeAppendFile(logFile, `${msg.text()}\n`));
      await waitForAppReady(page);
      return new Application({ page, electronApp });
    };

    const quitRunningApp = async () => {
      const { running } = session;
      session.running = undefined;
      if (running) await closeApp(running.electronApp, userdataDestinationPath);
    };

    await use({
      launchPreviousVersion: () => launch("previous-version", upgradeFrom),
      upgradeToNewVersion: async () => {
        await quitRunningApp();
        return launch("new-version", upgradeTo);
      },
    });

    try {
      const { running } = session;
      if (running && testInfo.status !== testInfo.expectedStatus) {
        await captureArtifacts(running.page, testInfo, running.electronApp, !!speculos.device);
      }
    } finally {
      await quitRunningApp();
    }
  },
});

export default test;
