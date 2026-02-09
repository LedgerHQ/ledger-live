import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "./tests/specs",
  retries: process.env.CI ? 2 : 0,
  timeout: process.env.CI ? 400000 : 1200000,
  outputDir: "./tests/artifacts/test-results",
  expect: {
    timeout: 41000,
  },
  globalTimeout: 0,
  globalSetup: require.resolve("./tests/utils/global.setup"),
  globalTeardown: require.resolve("./tests/utils/global.teardown"),
  use: {
    ignoreHTTPSErrors: true,
    screenshot: process.env.CI ? "only-on-failure" : "off",
  },
  forbidOnly: !!process.env.CI,
  preserveOutput: process.env.CI ? "failures-only" : "always",
  maxFailures: process.env.CI ? 5 : undefined,
  reportSlowTests: process.env.CI ? { max: 0, threshold: 60000 } : null,
  fullyParallel: true,
  workers: 1, // NOTE: 'macos-latest' and 'windows-latest' can't run 3 concurrent workers
  reporter: process.env.CI
    ? [
        ["html", { open: "never", outputFolder: "artifacts/html-report" }],
        ["github"],
        ["line"],
        [
          "allure-playwright",
          {
            links: {
              issue: {
                nameTemplate: "%s",
                urlTemplate: "https://ledgerhq.atlassian.net/browse/%s",
              },
              tms: {
                nameTemplate: "%s",
                urlTemplate: "https://ledgerhq.atlassian.net/browse/%s",
              },
            },
          },
        ],
        ["./tests/utils/customJsonReporter.ts"],
      ]
    : [["allure-playwright"]],
};

export default config;
