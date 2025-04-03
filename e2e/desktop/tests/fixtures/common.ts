import { test as base, Page, ElectronApplication, ChromiumBrowserContext } from "@playwright/test";
import fsPromises from "fs/promises";
import merge from "lodash/merge";
import * as path from "path";
import { OptionalFeatureMap } from "@ledgerhq/types-live";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { startSpeculos, stopSpeculos, specs } from "@ledgerhq/live-common/e2e/speculos";
import invariant from "invariant";

import { Application } from "tests/page";
import { safeAppendFile } from "tests/utils/fileUtils";
import { launchApp } from "tests/utils/electronUtils";
import { captureArtifacts } from "tests/utils/allureUtils";
import { randomUUID } from "crypto";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { lastValueFrom, Observable } from "rxjs";
import { CLI } from "../utils/cliUtils";
import { Monitor, Window } from "node-screenshots";
import fs from "fs";
import { execSync } from "child_process";

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
  cliCommands?: ((appjsonPath: string) => Observable<unknown> | Promise<unknown> | string)[];
};

const IS_NOT_MOCK = process.env.MOCK == "0";
const IS_DEBUG_MODE = !!process.env.PWDEBUG;
if (IS_NOT_MOCK) setEnv("DISABLE_APP_VERSION_REQUIREMENTS", true);
setEnv("SWAP_API_BASE", process.env.SWAP_API_BASE || "https://swap-stg.ledger-test.com/v5");
const BASE_PORT = 30000;
const MAX_PORT = 65535;
let portCounter = BASE_PORT; // Counter for generating unique ports

async function captureEntireScreen() {
  const windows = Monitor.all();

  windows.forEach(item => {
    item.captureImage().then(async data => {
      fs.mkdirSync(path.join(__dirname, "../../allure-results/"), { recursive: true });
      fs.writeFileSync(
        `${path.join(__dirname, "../../allure-results/") + item.id + Date.now()}.png`,
        await data.toPng(),
      );
    });
  });
}

export const test = base.extend<TestFixtures>({
  env: undefined,
  lang: "en-US",
  theme: "dark",
  userdata: undefined,
  settings: { shareAnalytics: true, hasSeenAnalyticsOptInPrompt: true },
  featureFlags: undefined,
  simulateCamera: undefined,
  speculosApp: undefined,
  cliCommands: [],

  app: async ({ page }, use) => {
    const app = new Application(page);
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
    },
    use,
    testInfo,
  ) => {
    // create userdata path
    await fsPromises.mkdir(userdataDestinationPath, { recursive: true });

    const fileUserData = userdataOriginalFile
      ? await fsPromises.readFile(userdataOriginalFile, { encoding: "utf-8" }).then(JSON.parse)
      : {};

    const userData = merge({ data: { settings } }, fileUserData);
    await fsPromises.writeFile(`${userdataDestinationPath}/app.json`, JSON.stringify(userData));

    let device: any | undefined;

    try {
      if (IS_NOT_MOCK && speculosApp) {
        // Ensure the portCounter stays within the valid port range
        if (portCounter > MAX_PORT) {
          portCounter = BASE_PORT;
        }
        const speculosPort = portCounter++;
        setEnv("PLAYWRIGHT_RUN", true);
        setEnv(
          "SPECULOS_PID_OFFSET",
          (speculosPort - BASE_PORT) * 1000 + parseInt(process.env.TEST_WORKER_INDEX || "0") * 100,
        );
        device = await startSpeculos(
          testInfo.title.replace(/ /g, "_"),
          specs[speculosApp.name.replace(/ /g, "_")],
        );
        invariant(device, "[E2E Setup] Speculos not started");
        invariant(device.ports.apiPort, "[E2E Setup] speculosApiPort not defined");
        const speculosApiPort = device.ports.apiPort.toString();

        setEnv("SPECULOS_API_PORT", speculosApiPort);
        setEnv("MOCK", "");
        process.env.SPECULOS_API_PORT = speculosApiPort;
        process.env.MOCK = "";

        if (cliCommands?.length) {
          CLI.registerSpeculosTransport(speculosApiPort);
          for (const cmd of cliCommands) {
            const promise = await cmd(`${userdataDestinationPath}/app.json`);
            const result =
              promise instanceof Observable ? await lastValueFrom(promise) : await promise;
            console.log("CLI result: ", result);
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
      if (device) {
        await stopSpeculos(device.id);
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
      if (msg.type() == "error") {
        console.error(txt);
      }

      // Direct Electron console to Node terminal.
      console.log(txt);

      safeAppendFile(logFile, `${txt}\n`);
    });
    page.on("pageerror", error => {
      console.error("Uncaught exception: " + error);
      safeAppendFile(logFile, `Uncaught exception: ${error}\n`);
    });
    captureEntireScreen();

    // app is loaded
    //await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle");
    //await page.waitForSelector("#loader-container", { state: "hidden" });
    await page.screenshot({ path: testInfo.outputPath("screenshot.png") });

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
