import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "./tests/specs",
  retries: process.env.CI ? 1 : 0,
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
    // Playwright will capture screenshots for the main view and any open webviews
    // Handle screenshots ourselves to avoid multiple results
    screenshot: "off",
  },
  forbidOnly: !!process.env.CI,
  preserveOutput: process.env.CI ? "failures-only" : "always",
  maxFailures: process.env.CI ? 5 : undefined,
  reportSlowTests: process.env.CI ? { max: 0, threshold: 60000 } : null,
  fullyParallel: true,
  workers: process.env.REMOTE_SPECULOS === "true" ? "150%" : "100%",
  reporter: process.env.CI
    ? [
        ["./tests/reporters/cardSessionReporter.ts"],
        ["./tests/reporters/lockDeferralReporter.ts"],
        ["github"],
        ["list"],
        [
          "allure-playwright",
          {
            detail: false,
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
      ]
    : [
        ["./tests/reporters/cardSessionReporter.ts"],
        ["./tests/reporters/lockDeferralReporter.ts"],
        ["allure-playwright", { detail: false }],
      ],
};

export default config;
