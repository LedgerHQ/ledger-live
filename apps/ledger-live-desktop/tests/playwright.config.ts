import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "specs/",
  testIgnore: "specs/recorder.spec.ts",
  outputDir: "./artifacts/test-results",
  timeout: process.env.CI ? 190000 : 600000,
  expect: {
    timeout: 30000,
    toHaveScreenshot: {
      /**
       * do not increase unless it makes most tests flaky
       * if you need a less sensitive threshold for a given test,
       * configure it for specific screenshots
       * */
      maxDiffPixelRatio: 0.005,
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  globalTimeout: 0,
  globalSetup: require.resolve("./utils/global-setup"),
  globalTeardown: require.resolve("./utils/global-teardown"),
  use: {
    launchOptions: {
      // FIXME: launchOptions doesn't seem to work, go to fixtures/common.ts
      slowMo: 100,
    },
    viewport: { width: 1024, height: 768 }, // FIXME: viewport doesn't seem to work
    ignoreHTTPSErrors: true,
    screenshot: process.env.CI ? "on" : "off",
    video: process.env.CI ? "on-first-retry" : "off", // FIXME: "off" doesn't seem to work
    trace: process.env.CI ? "retain-on-failure" : "off", // FIXME: traceview doesn't seem to work
  },
  forbidOnly: !!process.env.CI,
  preserveOutput: process.env.CI ? "failures-only" : "always",
  maxFailures: process.env.CI ? 5 : undefined,
  reportSlowTests: process.env.CI ? { max: 0, threshold: 60000 } : null,
  workers: process.env.CI ? 1 : 1, // NOTE: 'macos-latest' and 'windows-latest' can't run 3 concurrent workers
  retries: process.env.CI ? 2 : 0, // FIXME: --update-snapshots doesn't work with --retries
  reporter: process.env.CI
    ? [
        ["html", { open: "never", outputFolder: "artifacts/html-report" }],
        ["github"],
        ["line"],
        ["allure-playwright"],
      ]
    : "list",
};

export default config;
