import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "specs/",
  testIgnore: "specs/recorder.spec.ts",
  outputDir: "./artifacts/test-results",
  timeout: process.env.CI ? 190000 : 600000,
  expect: {
    timeout: 41000,
    toHaveScreenshot: {
      /**
       * do not increase unless it makes most tests flaky
       * if you need a less sensitive threshold for a given test,
       * configure it for specific screenshots
       * */
      maxDiffPixelRatio: 0.005,
    },
  },
  globalTimeout: 0,
  globalSetup: require.resolve("./utils/global-setup"),
  globalTeardown: require.resolve("./utils/global-teardown"),
  use: {
    ignoreHTTPSErrors: true,
    screenshot: process.env.CI ? "on" : "off",
  },
  forbidOnly: !!process.env.CI,
  preserveOutput: process.env.CI ? "failures-only" : "always",
  maxFailures: process.env.CI ? 5 : undefined,
  reportSlowTests: process.env.CI ? { max: 0, threshold: 60000 } : null,
  fullyParallel: true,
  workers: "50%", // NOTE: 'macos-latest' and 'windows-latest' can't run 3 concurrent workers
  retries: 0, // We explicitly want to disable retries to be strict about avoiding flaky tests. (see https://github.com/LedgerHQ/ledger-live/pull/4918)
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
