import { test as base, Page, ElectronApplication, ChromiumBrowserContext } from "@playwright/test";
import { mkdir, readFile, writeFile } from "fs/promises";
import merge from "lodash/merge";
import * as path from "path";
import { OptionalFeatureMap } from "@ledgerhq/types-live";
import { getEnv, setEnv } from "@ledgerhq/live-env";

import { Application } from "tests/page";
import { safeAppendFile, NANO_APP_CATALOG_PATH } from "tests/utils/fileUtils";
import { launchApp } from "tests/utils/electronUtils";
import { captureArtifacts } from "tests/utils/allureUtils";
import { randomUUID } from "crypto";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { lastValueFrom, Observable } from "rxjs";
import { CLI } from "tests/utils/cliUtils";
import { launchSpeculos, killSpeculos } from "tests/utils/speculosUtils";
import { SpeculosDevice } from "@ledgerhq/live-common/e2e/speculos";

type CliCommand = (appjsonPath: string) => Observable<unknown> | Promise<unknown> | string;

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
};

const IS_NOT_MOCK = process.env.MOCK == "0";
const IS_DEBUG_MODE = !!process.env.PWDEBUG;
if (IS_NOT_MOCK) setEnv("DISABLE_APP_VERSION_REQUIREMENTS", true);
setEnv("SWAP_API_BASE", process.env.SWAP_API_BASE || "https://swap-stg.ledger-test.com/v5");

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

  app: async ({ page, electronApp }, use) => {
    const app = new Application(page, electronApp);
    await use(app);
  },

  userdataDestinationPath: async ({}, use) => {
    await use(path.join(__dirname, "../artifacts/userdata", randomUUID()));
  },
  userdataOriginalFile: async ({ userdata }, use) => {
    await use(userdata && path.join(__dirname, "../userdata/", `${userdata}.json`));
  },
  userdataFile: async ({ userdataDestinationPath }, use) => {
    const fullFilePath = path.join(userdataDestinationPath, "app.json");
    await use(fullFilePath);
  },

  electronApp: async (
    {
      lang,
      theme,
      userdataDestinationPath,
      userdataOriginalFile,
      settings,
      env,
      featureFlags,
      simulateCamera,
      speculosApp,
      cliCommands,
      cliCommandsOnApp,
      extraUserdataFiles,
    },
    use,
    testInfo,
  ) => {
    // create userdata path
    await mkdir(userdataDestinationPath, { recursive: true });

    const fileUserData = userdataOriginalFile
      ? await readFile(userdataOriginalFile, { encoding: "utf-8" }).then(JSON.parse)
      : {};

    const userData = merge({ data: { settings } }, fileUserData);
    await writeFile(`${userdataDestinationPath}/app.json`, JSON.stringify(userData));
    if (extraUserdataFiles) {
      await Promise.all(
        Object.entries(extraUserdataFiles).map(([name, contents]) =>
          writeFile(path.join(userdataDestinationPath, name), contents),
        ),
      );
    }

    let speculos: SpeculosDevice | undefined;

    try {
      setEnv("PLAYWRIGHT_RUN", true);
      setEnv("E2E_NANO_APP_VERSION_PATH", NANO_APP_CATALOG_PATH);
      if (IS_NOT_MOCK && speculosApp) {
        setEnv("MOCK", "");
        process.env.MOCK = "";

        if (cliCommandsOnApp?.length) {
          for (const { app, cmd } of cliCommandsOnApp) {
            speculos = await launchSpeculos(app.name);
            CLI.registerSpeculosTransport(speculos.port.toString());
            await executeCliCommand(cmd, userdataDestinationPath);
            await killSpeculos(speculos.id);
          }
        }

        speculos = await launchSpeculos(speculosApp.name, testInfo.title);

        if (cliCommands?.length) {
          CLI.registerSpeculosTransport(speculos.port.toString());
          for (const cmd of cliCommands) {
            await executeCliCommand(cmd, userdataDestinationPath);
          }
        }
      }

      const mergedFeatureFlags = merge({}, DEFAULT_FEATURE_FLAGS, featureFlags);

      // default environment variables
      env = Object.assign(
        {
          ...process.env,
          VERBOSE: true,
          MOCK: IS_NOT_MOCK ? undefined : true,
          MOCK_COUNTERVALUES: IS_NOT_MOCK ? undefined : true,
          HIDE_DEBUG_MOCK: true,
          CI: process.env.CI || undefined,
          PLAYWRIGHT_RUN: true,
          CRASH_ON_INTERNAL_CRASH: true,
          LEDGER_MIN_HEIGHT: 768,
          FEATURE_FLAGS: JSON.stringify(mergedFeatureFlags),
          MANAGER_DEV_MODE: IS_NOT_MOCK ? true : undefined,
          SPECULOS_API_PORT: IS_NOT_MOCK ? getEnv("SPECULOS_API_PORT")?.toString() : undefined,
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
      });

      await use(electronApp);

      try {
        await electronApp.close();
      } catch {
        // App may already be closed when capturing failure video
      }
    } finally {
      if (speculos) {
        await killSpeculos(speculos.id);
      }
    }
  },
  page: async ({ electronApp }, use, testInfo) => {
    // app is ready
    const page = await electronApp.firstWindow();
    // we need to give enough time for the playwright app to start. when the CI is slow, 30s was apprently not enough.
    page.setDefaultTimeout(120000);

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

    // app is loaded
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector("#loader-container", { state: "hidden" });

    // use page in the test
    await use(page);

    // Take screenshot and video only on failure
    if (testInfo.status !== "passed") {
      await captureArtifacts(page, testInfo, electronApp);
    }

    //Remove video if test passed
    if (testInfo.status === "passed") {
      await electronApp.close();
      await page.video()?.delete();
    }
  },
});

export default test;
