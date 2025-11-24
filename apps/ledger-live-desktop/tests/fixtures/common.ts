import { test as base, Page, ElectronApplication } from "@playwright/test";
import fsPromises from "fs/promises";
import merge from "lodash/merge";
import * as path from "path";
import { OptionalFeatureMap } from "@ledgerhq/types-live";

import { Application } from "tests/page";
import { safeAppendFile } from "tests/utils/fileUtils";
import { launchApp } from "tests/utils/electronUtils";
import { captureArtifacts } from "tests/utils/allureUtils";
import { responseLogfilePath } from "tests/utils/networkResponseLogger";
import { randomUUID } from "crypto";

type TestFixtures = {
  lang: string;
  theme: "light" | "dark" | "no-preference" | undefined;
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
};

const IS_DEBUG_MODE = !!process.env.PWDEBUG;

export const test = base.extend<TestFixtures>({
  env: undefined,
  lang: "en-US",
  theme: "dark",
  userdata: undefined,
  settings: { shareAnalytics: true, hasSeenAnalyticsOptInPrompt: true },
  featureFlags: undefined,
  simulateCamera: undefined,

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
    },
    use,
  ) => {
    // create userdata path
    await fsPromises.mkdir(userdataDestinationPath, { recursive: true });

    const fileUserData = userdataOriginalFile
      ? await fsPromises.readFile(userdataOriginalFile, { encoding: "utf-8" }).then(JSON.parse)
      : {};

    const userData = merge({ data: { settings } }, fileUserData);
    await fsPromises.writeFile(`${userdataDestinationPath}/app.json`, JSON.stringify(userData));

    // default environment variables
    env = Object.assign(
      {
        ...process.env,
        VERBOSE: true,
        MOCK: true,
        MOCK_COUNTERVALUES: true,
        HIDE_DEBUG_MOCK: true,
        CI: process.env.CI || undefined,
        PLAYWRIGHT_RUN: true,
        CRASH_ON_INTERNAL_CRASH: true,
        LEDGER_MIN_HEIGHT: 768,
        FEATURE_FLAGS: JSON.stringify(featureFlags),
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
  },
  page: async ({ electronApp }, use, testInfo) => {
    // app is ready
    const page = await electronApp.firstWindow();
    // we need to give enough time for the playwright app to start. when the CI is slow, 30s was apprently not enough.
    page.setDefaultTimeout(120000);

    if (process.env.PLAYWRIGHT_CPU_THROTTLING_RATE) {
      const client = await page.context().newCDPSession(page);
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
