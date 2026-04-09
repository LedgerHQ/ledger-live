import { test as base, Page, ElectronApplication, ChromiumBrowserContext } from "@playwright/test";
import { mkdir, readFile, writeFile } from "fs/promises";
import merge from "lodash/merge";
import * as path from "path";
import { OptionalFeatureMap } from "@ledgerhq/types-live";
import { setEnv } from "@ledgerhq/live-env";

import { Application } from "tests/page";
import { safeAppendFile, NANO_APP_CATALOG_PATH } from "tests/utils/fileUtils";
import { launchApp } from "tests/utils/electronUtils";
import { captureArtifacts, addTeamOwner, attachMergedFeatureFlags } from "tests/utils/allureUtils";
import { isLastRetry } from "tests/utils/testInfoUtils";
import { WebviewLogCollector } from "tests/utils/webviewLogCollector";
import { randomUUID } from "crypto";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { lastValueFrom, Observable } from "rxjs";
import { launchSpeculos, cleanSpeculos } from "tests/utils/speculosUtils";
import { getSpeculosAddress, SpeculosDevice } from "@ledgerhq/live-common/e2e/speculos";
import { attachNetworkLogging } from "../utils/networkLogging";
import { LWD_WALLET_40_FF_DISABLED, LWD_WALLET_40_FF_ENABLED } from "tests/utils/featureFlagUtils";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { unregisterAllTransportModules } from "@ledgerhq/live-common/hw/index";
import { parseExtraFeatureFlags } from "../utils/featureFlagsJsonUtils";

type CliCommand = (appjsonPath: string) => Observable<unknown> | Promise<unknown> | string;

/** Mutable Speculos handle: {@link current} is always the latest device for teardown and env. */
export type SpeculosFixtureHandle = {
  get current(): SpeculosDevice;
  relaunch: (appName: string) => Promise<SpeculosDevice>;
};

type TestFixtures = {
  lang: string;
  theme: "light" | "dark" | "no-preference" | undefined;
  speculosApp: AppInfos;
  userdata?: string;
  extraUserdataFiles?: Record<string, string>;
  settings: Record<string, unknown>;
  userdataDestinationPath: string;
  userdataOriginalFile?: string;
  userdataFile: string;
  env: Record<string, string>;
  electronApp: ElectronApplication;
  page: Page;
  featureFlags: OptionalFeatureMap;
  simulateCamera: string;
  app: Application;
  cliCommands?: CliCommand[];
  cliCommandsOnApp?: {
    app: AppInfos;
    cmd: CliCommand;
  }[];
  localManifestOverride?: LiveAppManifest[];
  teamOwner?: Team;
  speculos: SpeculosFixtureHandle;
};

const IS_DEBUG_MODE = !!process.env.PWDEBUG;

setEnv("DISABLE_APP_VERSION_REQUIREMENTS", true);
setEnv("SWAP_API_BASE", process.env.SWAP_API_BASE || "https://swap-stg.ledger-test.com/v5");

const EXTRA_FEATURE_FLAGS: OptionalFeatureMap = parseExtraFeatureFlags(
  process.env.E2E_FEATURE_FLAGS_JSON,
);

const DEFAULT_FEATURE_FLAGS: OptionalFeatureMap = {
  lldModularDrawer: {
    enabled: true,
    params: {
      add_account: true,
      earn_flow: true,
      live_app: true,
      receive_flow: false,
      send_flow: false,
      enableModularization: true,
      enableDialogDesktop: true,
      searchDebounceTime: 300,
      backendEnvironment: "PROD",
      live_apps_allowlist: [],
      live_apps_blocklist: [],
    },
  },
  ...(process.env.E2E_ENABLE_WALLET40 === "1"
    ? LWD_WALLET_40_FF_ENABLED
    : LWD_WALLET_40_FF_DISABLED),
};

async function executeCliCommand(cmd: CliCommand, userdataDestinationPath?: string) {
  const promise = await cmd(`${userdataDestinationPath}/app.json`);
  const result = promise instanceof Observable ? await lastValueFrom(promise) : await promise;
  console.log("CLI result: ", result);
}

export const test = base.extend<TestFixtures>({
  env: undefined,
  lang: "en-US",
  theme: "dark",
  userdata: undefined,
  settings: { shareAnalytics: false, hasSeenAnalyticsOptInPrompt: true },
  featureFlags: undefined,
  simulateCamera: undefined,
  speculosApp: undefined,
  cliCommands: [],
  cliCommandsOnApp: [],
  extraUserdataFiles: undefined,
  localManifestOverride: undefined,
  teamOwner: undefined,

  app: async ({ page, electronApp }, use) => {
    const app = new Application(page, electronApp);
    await use(app);
  },

  userdataDestinationPath: async (
    { userdataOriginalFile, settings, extraUserdataFiles, localManifestOverride },
    use,
  ) => {
    const userdataDestinationPath = path.join(__dirname, "../artifacts/userdata", randomUUID());
    // create userdata path
    await mkdir(userdataDestinationPath, { recursive: true });

    const fileUserData = userdataOriginalFile
      ? await readFile(userdataOriginalFile, { encoding: "utf-8" }).then(JSON.parse)
      : {};

    const userData = merge({ data: { settings } }, fileUserData);
    if (localManifestOverride?.length) {
      userData.data = userData.data || {};
      userData.data.discover = userData.data.discover || {};
      userData.data.discover.localLiveApp = localManifestOverride;
    }
    await writeFile(`${userdataDestinationPath}/app.json`, JSON.stringify(userData));
    if (extraUserdataFiles) {
      await Promise.all(
        Object.entries(extraUserdataFiles).map(([name, contents]) =>
          writeFile(path.join(userdataDestinationPath, name), contents),
        ),
      );
    }
    await use(userdataDestinationPath);
  },
  userdataOriginalFile: async ({ userdata }, use) => {
    await use(userdata && path.join(__dirname, "../userdata/", `${userdata}.json`));
  },
  userdataFile: async ({ userdataDestinationPath }, use) => {
    const fullFilePath = path.join(userdataDestinationPath, "app.json");
    await use(fullFilePath);
  },

  speculos: async (
    { speculosApp, cliCommands, userdataDestinationPath, cliCommandsOnApp },
    use,
    testInfo,
  ) => {
    let currentDevice: SpeculosDevice | undefined;

    const handle: SpeculosFixtureHandle = {
      get current(): SpeculosDevice {
        if (!currentDevice) {
          throw new Error("[E2E] speculos fixture: no device (missing speculosApp?)");
        }
        return currentDevice;
      },
      relaunch: async (appName: string) => {
        currentDevice = await launchSpeculos(appName, testInfo.title, currentDevice);
        return currentDevice;
      },
    };

    try {
      setEnv("PLAYWRIGHT_RUN", true);
      setEnv("E2E_NANO_APP_VERSION_PATH", NANO_APP_CATALOG_PATH);

      setEnv("MOCK", "");
      process.env.MOCK = "";

      unregisterAllTransportModules();

      if (cliCommandsOnApp?.length) {
        for (const { app, cmd } of cliCommandsOnApp) {
          currentDevice = await launchSpeculos(app.name, testInfo.title);
          await executeCliCommand(cmd, userdataDestinationPath);
          await cleanSpeculos(currentDevice);
        }
      }

      if (speculosApp) {
        currentDevice = await launchSpeculos(speculosApp.name, testInfo.title);

        if (cliCommands?.length) {
          for (const cmd of cliCommands) {
            await executeCliCommand(cmd, userdataDestinationPath);
          }
        }
      }

      await use(handle);
    } finally {
      if (currentDevice) {
        await cleanSpeculos(currentDevice);
      }
    }
  },

  electronApp: async (
    {
      lang,
      theme,
      userdataDestinationPath,
      env,
      featureFlags,
      simulateCamera,
      speculos,
      speculosApp,
    },
    use,
    testInfo,
  ) => {
    const mergedFeatureFlags = merge({}, DEFAULT_FEATURE_FLAGS, EXTRA_FEATURE_FLAGS, featureFlags);
    await attachMergedFeatureFlags(testInfo, mergedFeatureFlags);

    // default environment variables
    env = Object.assign(
      {
        ...process.env,
        VERBOSE: true,
        MOCK: undefined,
        MOCK_COUNTERVALUES: undefined,
        HIDE_DEBUG_MOCK: true,
        CI: process.env.CI || undefined,
        PLAYWRIGHT_RUN: true,
        CRASH_ON_INTERNAL_CRASH: true,
        LEDGER_MIN_HEIGHT: 768,
        FEATURE_FLAGS: JSON.stringify(mergedFeatureFlags),
        MANAGER_DEV_MODE: true,
        SPECULOS_API_PORT: speculosApp ? String(speculos.current.port) : undefined,
        SPECULOS_ADDRESS: speculosApp ? getSpeculosAddress() : undefined,
        DISABLE_TRANSACTION_BROADCAST: process.env.DISABLE_TRANSACTION_BROADCAST || "1",
      },
      env,
    );

    // launch app
    const windowSize = { width: 1024, height: 768 };

    const electronApp: ElectronApplication = await launchApp({
      env,
      lang,
      theme,
      userdataDestinationPath,
      simulateCamera,
      windowSize,
      recordVideo: isLastRetry(testInfo),
    });

    await use(electronApp);

    try {
      await electronApp.close();
    } catch {
      // App may already be closed when capturing failure video
    }
  },
  page: async ({ electronApp, speculosApp, cliCommandsOnApp, teamOwner }, use, testInfo) => {
    // app is ready
    const page = await electronApp.firstWindow();

    if (teamOwner !== undefined) {
      await addTeamOwner(teamOwner);
    }
    // we need to give enough time for the playwright app to start. when the CI is slow, 30s was apprently not enough.
    page.setDefaultTimeout(120000);

    attachNetworkLogging(page, testInfo);

    if (process.env.PLAYWRIGHT_CPU_THROTTLING_RATE) {
      const client = await (page.context() as ChromiumBrowserContext).newCDPSession(page);
      await client.send("Emulation.setCPUThrottlingRate", {
        rate: parseInt(process.env.PLAYWRIGHT_CPU_THROTTLING_RATE),
      });
    }

    // record all logs into an artifact
    const logFile = testInfo.outputPath("logs.log");
    page.on("console", msg => {
      const txt = msg.text();
      if (IS_DEBUG_MODE && msg.type() == "error") {
        console.error(txt);
      }
      if (IS_DEBUG_MODE) {
        // Direct Electron console to Node terminal.
        console.log(txt);
      }
      safeAppendFile(logFile, `${txt}\n`);
    });

    // capture webview console and network logs for debugging (e.g. swap live app)
    const webviewCollector = new WebviewLogCollector();
    webviewCollector.start(electronApp);

    // app is loaded
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector("#loader-container", { state: "hidden" });

    // use page in the test
    await use(page);

    // Take screenshot and video only on failure
    if (testInfo.status !== "passed") {
      const takeSpeculosScreenshot = Boolean(speculosApp || (cliCommandsOnApp?.length ?? 0) > 0);
      await captureArtifacts(page, testInfo, electronApp, takeSpeculosScreenshot, webviewCollector);
    }

    // Remove video if test passed
    if (testInfo.status === "passed") {
      await electronApp.close();
      await page.video()?.delete();
    }
  },
});

export default test;
