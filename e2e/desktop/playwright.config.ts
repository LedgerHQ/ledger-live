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
    trace: "on",
  },
  forbidOnly: !!process.env.CI,
  preserveOutput: process.env.CI ? "failures-only" : "always",
  maxFailures: process.env.CI ? 5 : undefined,
  reportSlowTests: process.env.CI ? { max: 0, threshold: 60000 } : null,
  fullyParallel: true,
  workers: "100%",
  reporter: process.env.CI
    ? [
        ["list"],
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
        ["github"],
        ["./tests/utils/customJsonReporter.ts"],
      ]
    : [["allure-playwright"]],
};

export default config;
