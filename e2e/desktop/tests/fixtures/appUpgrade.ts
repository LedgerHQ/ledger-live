import type { ElectronApplication, Page, TestInfo } from "@playwright/test";
import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";
import { test as base } from "tests/fixtures/common";
import { step } from "tests/misc/reporters/step";
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

type LaunchOptions = Omit<Parameters<typeof launchApp>[0], "executablePath">;
type RunningApp = { electronApp: ElectronApplication; page: Page };

type AppUpgradeOptions = {
  from: NightlyBuild;
  /** Undefined for the local build under test. */
  to: NightlyBuild | undefined;
  launchOptions: LaunchOptions;
  testInfo: TestInfo;
};

/** Runs two versions of the app, one after the other, on the same profile. */
export class AppUpgrade {
  readonly fromVersion: string;
  readonly toVersion: string;
  private readonly from: NightlyBuild;
  private readonly to: NightlyBuild | undefined;
  private readonly launchOptions: LaunchOptions;
  private readonly testInfo: TestInfo;
  private running: RunningApp | undefined;

  constructor(options: AppUpgradeOptions) {
    const { from, to, launchOptions, testInfo } = options;
    this.from = from;
    this.to = to;
    this.launchOptions = launchOptions;
    this.testInfo = testInfo;
    this.fromVersion = from.version;
    this.toVersion = to?.version ?? "the build under test";
  }

  @step("Launch the previous version: $fromVersion")
  async launchPreviousVersion(): Promise<Application> {
    return this.launch("previous-version", this.from);
  }

  @step("Upgrade to $toVersion on the same profile")
  async upgradeToNewVersion(): Promise<Application> {
    await this.testInfo.attach("Upgrade path", {
      body: `${this.fromVersion} -> ${this.toVersion}`,
      contentType: "text/plain",
    });
    await this.quitPreviousVersion();
    return this.startNewVersion();
  }

  @step("Quit $fromVersion, as an update does")
  private async quitPreviousVersion(): Promise<void> {
    await this.close();
  }

  @step("Start $toVersion and wait for it to load")
  private async startNewVersion(): Promise<Application> {
    return this.launch("new-version", this.to);
  }

  /** Takes the failure screenshot and logs of whichever version is running. */
  async captureFailure(takeSpeculosScreenshot: boolean): Promise<void> {
    if (!this.running) return;
    const { page, electronApp } = this.running;
    await captureArtifacts(page, this.testInfo, electronApp, takeSpeculosScreenshot);
  }

  async close(): Promise<void> {
    const { running } = this;
    this.running = undefined;
    if (running) await closeApp(running.electronApp, this.launchOptions.userdataDestinationPath);
  }

  private async launch(logName: string, build: NightlyBuild | undefined): Promise<Application> {
    const electronApp = await launchApp({
      ...this.launchOptions,
      env: { ...this.launchOptions.env, ...(build && NIGHTLY_APP_ENV) },
      executablePath: build?.executablePath,
    });
    const page = await electronApp.firstWindow();
    this.running = { electronApp, page };
    page.setDefaultTimeout(TIMEOUT.xlarge);
    const logFile = this.testInfo.outputPath(`logs-${logName}.log`);
    page.on("console", msg => safeAppendFile(logFile, `${msg.text()}\n`));
    await waitForAppReady(page);
    return new Application({ page, electronApp });
  }
}

type AppUpgradeFixtures = {
  /** `E2E_UPGRADE_FROM_VERSION`, or the latest published nightly. */
  upgradeFrom: NightlyBuild;
  /** `E2E_UPGRADE_TO_VERSION` when set, otherwise the local build under test. */
  upgradeTo: NightlyBuild | undefined;
  appUpgrade: AppUpgrade;
};

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
    const appUpgrade = new AppUpgrade({
      from: upgradeFrom,
      to: upgradeTo,
      launchOptions: {
        env: buildAppEnv({
          env,
          mergedFeatureFlags: getMergedFeatureFlags({ testFlags: featureFlags }),
          speculosDevice: speculos.device,
          testId: testInfo.testId,
        }),
        lang,
        theme,
        userdataDestinationPath,
        windowSize: { width: 1024, height: 768 },
      },
      testInfo,
    });
    if (appUpgrade.fromVersion === upgradeTo?.version) {
      throw new Error(`Nothing to upgrade: ${appUpgrade.fromVersion} is both versions`);
    }
    console.log(`[E2E] App upgrade: ${appUpgrade.fromVersion} -> ${appUpgrade.toVersion}`);

    await use(appUpgrade);

    try {
      if (testInfo.status !== testInfo.expectedStatus) {
        await appUpgrade.captureFailure(!!speculos.device);
      }
    } finally {
      await appUpgrade.close();
    }
  },
});

export default test;
