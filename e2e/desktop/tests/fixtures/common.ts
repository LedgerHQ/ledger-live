import { test as base, Page, ElectronApplication, ChromiumBrowserContext } from "@playwright/test";
import { mkdir, readFile, writeFile } from "fs/promises";
import merge from "lodash/merge";
import * as path from "path";
import { OptionalFeatureMap } from "@ledgerhq/types-live";
import { getEnv, setEnv } from "@ledgerhq/live-env";

import { Application } from "tests/page";
import { safeAppendFile } from "tests/utils/fileUtils";
import { launchApp } from "tests/utils/electronUtils";
import { captureArtifacts } from "tests/utils/allureUtils";
import { responseLogfilePath } from "tests/utils/networkResponseLogger";
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

    let speculos: SpeculosDevice | undefined;

    try {
      setEnv("PLAYWRIGHT_RUN", true);
      setEnv("E2E_NANO_APP_VERSION_PATH", "tests/artifacts/appVersion/nano-app-catalog.json");
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
          FEATURE_FLAGS: JSON.stringify(featureFlags),
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

      // close app
      await electronApp.close();
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

    // record network requests and responses to a file for debugging network errors
    const networkLogFile = testInfo.outputPath("network.log");
    page.on("request", request => {
      const requestData = {
        timestamp: new Date().toISOString(),
        type: "request",
        method: request.method(),
        url: request.url(),
        headers: request.headers(),
        postData: request.postData(),
      };
      safeAppendFile(networkLogFile, `${JSON.stringify(requestData)}\n`);
    });

    page.on("response", response => {
      const responseData = {
        timestamp: new Date().toISOString(),
        type: "response",
        status: response.status(),
        statusText: response.statusText(),
        url: response.url(),
        headers: response.headers(),
        fromServiceWorker: response.fromServiceWorker(),
      };
      safeAppendFile(networkLogFile, `${JSON.stringify(responseData)}\n`);

      // Also log failed requests to the main response log file
      if (!response.ok()) {
        safeAppendFile(
          responseLogfilePath,
          `[${testInfo.title}] ${response.status()} ${response.statusText()}: ${response.url()}\n`,
        );
      }
    });

    page.on("requestfailed", request => {
      const failureData = {
        timestamp: new Date().toISOString(),
        type: "request_failed",
        method: request.method(),
        url: request.url(),
        failure: request.failure()?.errorText || "Unknown error",
      };
      safeAppendFile(networkLogFile, `${JSON.stringify(failureData)}\n`);
      safeAppendFile(
        responseLogfilePath,
        `[${testInfo.title}] REQUEST FAILED: ${request.method()} ${request.url()} - ${request.failure()?.errorText || "Unknown error"}\n`,
      );
    });

    // app is loaded
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector("#loader-container", { state: "hidden" });

    // use page in the test
    await use(page);

    // Take screenshot and video only on failure
    if (testInfo.status !== "passed") {
      await captureArtifacts(page, testInfo);
    }

    //Remove video if test passed
    if (testInfo.status === "passed") {
      await electronApp.close();
      await page.video()?.delete();
    }
  },
});

export default test;
