import { PlaywrightTestConfig } from "@playwright/test";

const DEFAULT_RETRIES = process.env.CI ? 1 : 0;

const parseRetries = (value: string | undefined) => {
  const raw = (value ?? "").trim();
  const parsed = Number(raw);
  return raw && Number.isInteger(parsed) && parsed >= 0 ? parsed : DEFAULT_RETRIES;
};

const config: PlaywrightTestConfig = {
  testDir: "./tests/specs",
  retries: parseRetries(process.env.E2E_RETRIES),
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
  workers: "100%",
  reporter: process.env.CI
    ? [
        ["./tests/reporters/cardSessionReporter.ts"],
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
    : [["./tests/reporters/cardSessionReporter.ts"], ["allure-playwright", { detail: false }]],
};

export default config;
