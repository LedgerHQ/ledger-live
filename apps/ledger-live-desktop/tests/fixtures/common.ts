import { test as base, Page, ElectronApplication, _electron as electron } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { OptionalFeatureMap } from "@ledgerhq/types-live";
import { responseLogfilePath } from "../utils/networkResponseLogger";

export function generateUUID(): string {
  return crypto.randomBytes(16).toString("hex");
}

type TestFixtures = {
  lang: string;
  theme: "light" | "dark" | "no-preference" | undefined;
  userdata: string;
  userdataDestinationPath: string;
  userdataOriginalFile: string;
  userdataFile: string;
  env: Record<string, string>;
  electronApp: ElectronApplication;
  page: Page;
  featureFlags: OptionalFeatureMap;
  recordTestNamesForApiResponseLogging: void;
};

const IS_DEBUG_MODE = !!process.env.PWDEBUG;

const test = base.extend<TestFixtures>({
  env: undefined,
  lang: "en-US",
  theme: "dark",
  userdata: undefined,
  featureFlags: undefined,
  userdataDestinationPath: async ({}, use) => {
    use(path.join(__dirname, "../artifacts/userdata", generateUUID()));
  },
  userdataOriginalFile: async ({ userdata }, use) => {
    use(path.join(__dirname, "../userdata/", `${userdata}.json`));
  },
  userdataFile: async ({ userdataDestinationPath }, use) => {
    const fullFilePath = path.join(userdataDestinationPath, "app.json");
    use(fullFilePath);
  },
  electronApp: async (
    { lang, theme, userdata, userdataDestinationPath, userdataOriginalFile, env, featureFlags },
    use,
  ) => {
    // create userdata path
    fs.mkdirSync(userdataDestinationPath, { recursive: true });

    if (userdata) {
      fs.copyFileSync(userdataOriginalFile, `${userdataDestinationPath}/app.json`);
    }

    // default environment variables
    env = Object.assign(
      {
        ...process.env,
        MOCK: true,
        MOCK_COUNTERVALUES: true,
        HIDE_DEBUG_MOCK: true,
        CI: process.env.CI || undefined,
        PLAYWRIGHT_RUN: true,
        CRASH_ON_INTERNAL_CRASH: true,
        LEDGER_MIN_HEIGHT: 768,
        FEATURE_FLAGS: JSON.stringify(featureFlags),
        DESKTOP_LOGS_FILE: path.join(__dirname, "../artifacts/logs"),
      },
      env,
    );

    // launch app
    const windowSize = { width: 1024, height: 768 };

    const electronApp: ElectronApplication = await electron.launch({
      args: [
        `${path.join(__dirname, "../../.webpack/main.bundle.js")}`,
        `--user-data-dir=${userdataDestinationPath}`,
        // `--window-size=${window.width},${window.height}`, // FIXME: Doesn't work, window size can't be forced?
        "--force-device-scale-factor=1",
        "--disable-dev-shm-usage",
        // "--use-gl=swiftshader"
        "--no-sandbox",
        "--enable-logging",
      ],
      recordVideo: {
        dir: `${path.join(__dirname, "../artifacts/videos/")}`,
        size: windowSize, // FIXME: no default value, it could come from viewport property in conf file but it's not the case
      },
      env,
      colorScheme: theme,
      locale: lang,
      executablePath: require("electron/index.js"),
      timeout: 120000,
    });

    await use(electronApp);

    // close app
    await electronApp.close();
  },
  page: async ({ electronApp }, use) => {
    // app is ready
    const page = await electronApp.firstWindow();

    // start recording all network responses in artifacts/networkResponse.log
    page.on("response", async data => {
      const now = Date.now();
      const timestamp = new Date(now).toISOString();

      const headers = await data.allHeaders();

      if (headers.teststatus && headers.teststatus === "mocked") {
        fs.appendFileSync(
          responseLogfilePath,
          `[${timestamp}] MOCKED RESPONSE: ${data.request().url()}\n`,
        );
      } else {
        fs.appendFileSync(
          responseLogfilePath,
          `[${timestamp}] REAL RESPONSE: ${data.request().url()}\n`,
        );
      }
    });

    if (IS_DEBUG_MODE) {
      // Direct Electron console to Node terminal.
      page.on("console", console.log);
    }

    // app is loaded
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector("#loader-container", { state: "hidden" });

    // use page in the test
    await use(page);

    console.log(`Video for test recorded at: ${await page.video()?.path()}\n`);
  },
  // below is used for the logging file at `artifacts/networkResponses.log`
  recordTestNamesForApiResponseLogging: [
    async ({}, use, testInfo) => {
      fs.appendFileSync(
        responseLogfilePath,
        `Network call responses for test: '${testInfo.title}':\n`,
      );

      await use();

      fs.appendFileSync(responseLogfilePath, `\n`);
    },
    { auto: true },
  ],
});

export default test;
