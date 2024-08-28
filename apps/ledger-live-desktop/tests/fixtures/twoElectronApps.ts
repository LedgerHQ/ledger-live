import { test as base, Page, ElectronApplication } from "@playwright/test";
import { Application } from "tests/page";
import { launchApp } from "tests/utils/electronUtils";
import { OptionalFeatureMap } from "@ledgerhq/types-live";
import { AppInfos } from "tests/enum/AppInfos";
import path from "path";
import { randomUUID } from "crypto";
import fsPromises from "fs/promises";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { specs, startSpeculos, stopSpeculos } from "tests/utils/speculos";

type DualAppFixtures = {
  electronApp: ElectronApplication;
  electronApp2: ElectronApplication;
  page: Page;
  page2: Page;
  app: Application;
  app2: Application;
  lang: string;
  theme: "light" | "dark" | "no-preference" | undefined;
  userdata: string;
  userdata2: string; // Allow userdata2 to be passed from the test
  speculosApp: AppInfos;
  speculosApp2: AppInfos; // Allow speculosApp2 to be passed from the test
  env: Record<string, string>;
  featureFlags: OptionalFeatureMap;
  simulateCamera: string;
  userdataFile: string;
  userdataFile2: string; // New userdata file path for app2
  userdataDestinationPath: string;
  userdataOriginalFile: string;
  userdataOriginalFile2: string;
};

const IS_NOT_MOCK = process.env.MOCK == "0";
if (IS_NOT_MOCK) setEnv("DISABLE_APP_VERSION_REQUIREMENTS", true);
const BASE_PORT = 30000;
const MAX_PORT = 65535;
let portCounter = BASE_PORT; // Counter for generating unique ports

export const dualAppTest = base.extend<DualAppFixtures>({
  env: undefined,
  lang: "en-US",
  theme: "dark",
  userdata: undefined,
  userdata2: undefined,
  featureFlags: undefined,
  simulateCamera: undefined,
  speculosApp: undefined,
  speculosApp2: undefined,

  userdataDestinationPath: async ({}, use) => {
    await use(path.join(__dirname, "../artifacts/userdata", randomUUID()));
  },
  userdataOriginalFile: async ({ userdata }, use) => {
    await use(path.join(__dirname, "../userdata/", `${userdata}.json`));
  },
  userdataOriginalFile2: async ({ userdata2 }, use) => {
    await use(path.join(__dirname, "../userdata/", `${userdata2}.json`));
  },
  userdataFile: async ({ userdataDestinationPath }, use) => {
    const fullFilePath = path.join(userdataDestinationPath, "app.json");
    await use(fullFilePath);
  },

  // First Electron app fixture
  electronApp: async (
    {
      lang,
      theme,
      userdata,
      userdataDestinationPath,
      userdataOriginalFile,
      env,
      featureFlags,
      simulateCamera,
      speculosApp,
    },
    use,
    testInfo,
  ) => {
    // create userdata path
    await fsPromises.mkdir(userdataDestinationPath, { recursive: true });

    if (userdata) {
      await fsPromises.copyFile(userdataOriginalFile, `${userdataDestinationPath}/app.json`);
    }

    let device: any | undefined;

    if (IS_NOT_MOCK && speculosApp) {
      // Ensure the portCounter stays within the valid port range
      if (portCounter > MAX_PORT) {
        portCounter = BASE_PORT;
      }
      const speculosPort = portCounter++;
      setEnv(
        "SPECULOS_PID_OFFSET",
        (speculosPort - BASE_PORT) * 1000 + parseInt(process.env.TEST_WORKER_INDEX || "0") * 100,
      );
      device = await startSpeculos(
        testInfo.title.replace(/ /g, "_"),
        specs[speculosApp.name.replace(/ /g, "_")],
      );
      setEnv("SPECULOS_API_PORT", device?.ports.apiPort?.toString());
    }

    try {
      // default environment variables
      env = Object.assign(
        {
          ...process.env,
          VERBOSE: true,
          MOCK: IS_NOT_MOCK ? undefined : true,
          MOCK_COUNTERVALUES: true,
          HIDE_DEBUG_MOCK: true,
          CI: process.env.CI || undefined,
          PLAYWRIGHT_RUN: true,
          CRASH_ON_INTERNAL_CRASH: true,
          LEDGER_MIN_HEIGHT: 768,
          FEATURE_FLAGS: JSON.stringify(featureFlags),
          MANAGER_DEV_MODE: IS_NOT_MOCK ? true : undefined,
          SPECULOS_API_PORT: IS_NOT_MOCK ? getEnv("SPECULOS_API_PORT")?.toString() : undefined,
          DISABLE_TRANSACTION_BROADCAST:
            process.env.ENABLE_TRANSACTION_BROADCAST == "1" || !IS_NOT_MOCK ? undefined : 1,
        },
        env,
      );

      // launch app
      const windowSize = { width: 1024, height: 768 };
      const electronApp = await launchApp({
        env,
        lang,
        theme,
        userdataDestinationPath,
        simulateCamera,
        windowSize,
      });
      await use(electronApp);
      await electronApp.close();
    } finally {
      if (device) {
        await stopSpeculos(device);
      }
    }
  },

  // Second Electron app fixture
  electronApp2: async (
    {
      lang,
      theme,
      userdata2,
      userdataOriginalFile2,
      env,
      featureFlags,
      simulateCamera,
      speculosApp2,
    },
    use,
    testInfo,
  ) => {
    // create userdata path
    const userdataDestinationPath2 = path.join(__dirname, "../artifacts/userdata", randomUUID());
    await fsPromises.mkdir(userdataDestinationPath2, { recursive: true });

    if (userdata2) {
      await fsPromises.copyFile(userdataOriginalFile2, `${userdataDestinationPath2}/app.json`);
    }

    let device2: any | undefined;

    if (IS_NOT_MOCK && speculosApp2) {
      // Ensure the portCounter stays within the valid port range
      if (portCounter > MAX_PORT) {
        portCounter = BASE_PORT;
      }
      const speculosPort2 = portCounter++;
      setEnv(
        "SPECULOS_PID_OFFSET",
        (speculosPort2 - BASE_PORT) * 1000 + parseInt(process.env.TEST_WORKER_INDEX || "0") * 100,
      );
      device2 = await startSpeculos(
        testInfo.title.replace(/ /g, "_"),
        specs[speculosApp2.name.replace(/ /g, "_")],
      );
      setEnv("SPECULOS_API_PORT", device2?.ports.apiPort?.toString());
    }

    try {
      // default environment variables
      env = Object.assign(
        {
          ...process.env,
          VERBOSE: true,
          MOCK: IS_NOT_MOCK ? undefined : true,
          MOCK_COUNTERVALUES: true,
          HIDE_DEBUG_MOCK: true,
          CI: process.env.CI || undefined,
          PLAYWRIGHT_RUN: true,
          CRASH_ON_INTERNAL_CRASH: true,
          LEDGER_MIN_HEIGHT: 768,
          FEATURE_FLAGS: JSON.stringify(featureFlags),
          MANAGER_DEV_MODE: IS_NOT_MOCK ? true : undefined,
          SPECULOS_API_PORT: IS_NOT_MOCK ? getEnv("SPECULOS_API_PORT")?.toString() : undefined,
          DISABLE_TRANSACTION_BROADCAST:
            process.env.ENABLE_TRANSACTION_BROADCAST == "1" || !IS_NOT_MOCK ? undefined : 1,
        },
        env,
      );

      // launch app
      const windowSize = { width: 1024, height: 768 };
      const electronApp2 = await launchApp({
        env,
        lang,
        theme,
        userdataDestinationPath: userdataDestinationPath2,
        simulateCamera,
        windowSize,
      });
      await use(electronApp2);
      await electronApp2.close();
    } finally {
      if (device2) {
        await stopSpeculos(device2);
      }
    }
  },

  // Page fixture for the first app
  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow();
    await page.waitForLoadState("domcontentloaded");
    await use(page);
  },

  // Page fixture for the second app
  page2: async ({ electronApp2 }, use) => {
    const page2 = await electronApp2.firstWindow();
    await page2.waitForLoadState("domcontentloaded");
    await use(page2);
  },

  // Application model for the first app
  app: async ({ page }, use) => {
    const app = new Application(page);
    await use(app);
  },

  // Application model for the second app
  app2: async ({ page2 }, use) => {
    const app2 = new Application(page2);
    await use(app2);
  },
});

export default dualAppTest;
