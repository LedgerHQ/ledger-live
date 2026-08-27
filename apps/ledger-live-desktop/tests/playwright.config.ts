import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  projects: [
    {
      name: "mocked_tests",
      testDir: "specs/",
      testIgnore: ["**/speculos/**", "specs/recorder.spec.ts"],
      timeout: process.env.CI ? 190000 : 600000,
    },
  ],
  outputDir: "./artifacts/test-results",
  snapshotPathTemplate:
    "{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-platform}{ext}",
  expect: {
    timeout: 41000,
    toHaveScreenshot: {
      /**
       * do not increase unless it makes most tests flaky
       * if you need a less sensitive threshold for a given test,
       * configure it for specific screenshots
       * */
      maxDiffPixelRatio: 0.005,
      /** Disable CSS/JS animations to prevent flaky screenshot tests from mid-animation captures */
      animations: "disabled",
    },
  },
  globalTimeout: 0,
  globalSetup: require.resolve("./utils/global.setup"),
  globalTeardown: require.resolve("./utils/global.teardown"),
  use: {
    ignoreHTTPSErrors: true,
    screenshot: process.env.CI ? "only-on-failure" : "off",
    video: "off",
  },
  forbidOnly: !!process.env.CI,
  preserveOutput: process.env.CI ? "failures-only" : "always",
  maxFailures: process.env.CI ? 5 : undefined,
  reportSlowTests: process.env.CI ? { max: 0, threshold: 60000 } : null,
  fullyParallel: true,
  workers: "60%", // NOTE: 'macos-latest' and 'windows-latest' can't run 3 concurrent workers
  // One CI retry so a flake is observable at all — without a second attempt it is
  // indistinguishable from a plain failure. Local stays strict and immediate.
  retries: process.env.CI ? 1 : 0,
  failOnFlakyTests: false,
  reporter: process.env.CI
    ? [
        ["html", { open: "never", outputFolder: "artifacts/html-report" }],
        ["github"],
        ["line"],
        ["allure-playwright"],
        ["./utils/customJsonReporter.ts"],
        ["@ledgerhq/test-quarantine/playwright"],
      ]
    : [["allure-playwright"]],
};

export default config;
