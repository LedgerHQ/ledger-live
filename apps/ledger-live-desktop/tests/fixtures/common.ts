import { _electron as electron } from "playwright";
import {
  test as base,
  expect,
  request,
  Page,
  ElectronApplication,
  APIRequestContext,
} from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
// import { createSpeculosDevice } from "../../../../libs/ledger-live-common/src/load/speculos";
import { Feature, FeatureId } from "@ledgerhq/types-live";

export function generateUUID(): string {
  return crypto.randomBytes(16).toString("hex");
}

type TestFixtures = {
  lang: string;
  theme: "light" | "dark" | "no-preference" | undefined;
  userdata: string;
  userdataDestinationPath: string;
  userdataOriginalFile: string;
  userdataFile: any;
  env: Record<string, any>;
  speculosApp: any;
  speculos: any; //
  speculosApiContext: APIRequestContext;
  page: Page;
  featureFlags: { [key in FeatureId]?: Feature };
};

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
  speculosApp: undefined,
  speculos: async ({ speculosApp }, use) => {
    if (speculosApp) {
      const apduPort = "40000";
      const apiPort = "5001";
      const deviceProxy = "ws://localhost:8435";

      /*
      const device = await createSpeculosDevice(
        {
          model: "nanoS",
          firmware: "2.0",
          appName: speculosApp.appName,
          appVersion: speculosApp.appVersion,
          dependency: speculosApp.appDependency,
          seed: "secret",
          coinapps: "../../../../../coin-apps",
        },
        1,
      );
      */

      use({ apduPort, apiPort, deviceProxy });
    }
  },
  speculosApiContext: async ({ speculos }, use) => {
    const context = await request.newContext({
      baseURL: `http://localhost:${speculos.apiPort}`,
    });
    await context.delete("/events"); // Reset events
    await use(context);
    await context.dispose();
  },
  page: async (
    {
     
      lang,
     
      theme,
     
      userdata,
     
      userdataDestinationPath,
     
      userdataOriginalFile,
     
      env,
      speculos,
   ,
      featureFlags,
    }: TestFixtures,
    use: (page: Page) => void,
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
        LEDGER_MIN_HEIGHT: 768,
        SPECULOS_APDU_PORT: speculos.apduPort,
        SPECULOS_API_PORT: speculos.apiPort,
        DEVICE_PROXY_URL: speculos.deviceProxy,
        FEATURE_FLAGS: JSON.stringify(featureFlags),
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

    // app is ready
    const page = await electronApp.firstWindow();

    // start coverage
    const istanbulCLIOutput = path.join(__dirname, "../artifacts/.nyc_output");

    await page.addInitScript(() =>
      window.addEventListener("beforeunload", () =>
        (window as any).collectIstanbulCoverage(JSON.stringify((window as any).__coverage__)),
      ),
    );
    await fs.promises.mkdir(istanbulCLIOutput, { recursive: true });
    await page.exposeFunction("collectIstanbulCoverage", (coverageJSON: string) => {
      if (coverageJSON)
        fs.writeFileSync(
          path.join(istanbulCLIOutput, `playwright_coverage_${generateUUID()}.json`),
          coverageJSON,
        );
    });

    // app is loaded
    // expect(await page.title()).toBe("Ledger Live");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector("#loader-container", { state: "hidden" });

    // use page in the test
    await use(page);

    // stop coverage
    await page.evaluate(() =>
      (window as any).collectIstanbulCoverage(JSON.stringify((window as any).__coverage__)),
    );

    // close app
    await electronApp.close();
  },
});

export default test;
