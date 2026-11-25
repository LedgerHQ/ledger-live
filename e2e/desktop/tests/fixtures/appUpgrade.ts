import { expect, type ElectronApplication, type Page, type TestInfo } from "@playwright/test";
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
  findPreviousVersion,
  installPublishedBuild,
  localChannel,
  resolvePublishedVersion,
  type PublishedBuild,
} from "tests/utils/publishedBuildUtils";

/**
 * Nightlies and prereleases read this update feed (production builds ignore it). A closed port
 * fails the check as if offline, so the app does not install a newer build over the cached one on quit.
 */
const PUBLISHED_APP_ENV = { UPDATE_FEED_URL: "http://127.0.0.1:1" };

type LaunchOptions = Omit<Parameters<typeof launchApp>[0], "executablePath">;
type RunningApp = { electronApp: ElectronApplication; page: Page };

type AppUpgradeOptions = {
  from: PublishedBuild;
  /** Undefined for the local build under test. */
  to: PublishedBuild | undefined;
  launchOptions: LaunchOptions;
  testInfo: TestInfo;
};

/** Runs two versions of the app, one after the other, on the same profile. */
export class AppUpgrade {
  readonly fromVersion: string;
  readonly toVersion: string;
  private readonly from: PublishedBuild;
  private readonly to: PublishedBuild | undefined;
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

  private async launch(logName: string, build: PublishedBuild | undefined): Promise<Application> {
    const electronApp = await launchApp({
      ...this.launchOptions,
      env: { ...this.launchOptions.env, ...(build && PUBLISHED_APP_ENV) },
      executablePath: build?.executablePath,
    });
    const page = await electronApp.firstWindow();
    this.running = { electronApp, page };
    page.setDefaultTimeout(TIMEOUT.xlarge);
    const logFile = this.testInfo.outputPath(`logs-${logName}.log`);
    page.on("console", msg => safeAppendFile(logFile, `${msg.text()}\n`));
    await waitForAppReady(page);
    if (build) await this.expectRunningVersion(build.version, electronApp);
    return new Application({ page, electronApp });
  }

  /** Proves the report's version is the one that ran, not a build the cache or the updater swapped in. */
  @step("Check the running app is $0")
  private async expectRunningVersion(version: string, electronApp: ElectronApplication) {
    const runningVersion = await electronApp.evaluate(({ app }) => app.getVersion());
    expect(runningVersion, "Version the launched app reports").toBe(version);
  }
}

/**
 * `previous` is the version before `to` on its channel (n-1 for n), or the latest one of the
 * branch's channel when `to` is the local build. Anything else is a channel or an exact version.
 */
async function resolveUpgradeFromVersion(requested: string, to: PublishedBuild | undefined) {
  if (requested !== "previous") return resolvePublishedVersion(requested);
  return to ? findPreviousVersion(to.version) : resolvePublishedVersion(localChannel());
}

type AppUpgradeFixtures = {
  /**
   * `E2E_UPGRADE_TO_VERSION`: by default the latest build of the branch's channel (`next` on the
   * release branch, `hotfix` on the hotfix branch, `nightly` otherwise), or the local build for `local`.
   */
  upgradeTo: PublishedBuild | undefined;
  /** `E2E_UPGRADE_FROM_VERSION`: the version before `upgradeTo` on its channel by default. */
  upgradeFrom: PublishedBuild;
  appUpgrade: AppUpgrade;
};

export const test = base.extend<AppUpgradeFixtures>({
  upgradeTo: [
    async ({}, use) => {
      const requested = process.env.E2E_UPGRADE_TO_VERSION || localChannel();
      await use(
        requested === "local"
          ? undefined
          : await installPublishedBuild(await resolvePublishedVersion(requested)),
      );
    },
    { timeout: TIMEOUT.xxxxlarge },
  ],

  upgradeFrom: [
    async ({ upgradeTo }, use) => {
      const requested = process.env.E2E_UPGRADE_FROM_VERSION || "previous";
      await use(await installPublishedBuild(await resolveUpgradeFromVersion(requested, upgradeTo)));
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
