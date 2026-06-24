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
  projects: [
    {
      // Specs that broadcast real approve/revoke txs all sign from the same
      // shared EOA. Pin them to a single worker so their broadcasts never overlap and
      // race on the account nonce. Tag the broadcasting tests with @swapBroadcast.
      name: "swap-broadcast-serial",
      grep: /@swapBroadcast/,
      workers: 1,
    },
    {
      // Everything else runs fully parallel (inherits the global workers + fullyParallel).
      name: "parallel",
      grepInvert: /@swapBroadcast/,
    },
  ],
  reporter: process.env.CI
    ? [
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
      ["./tests/utils/customJsonReporter.ts"],
    ]
    : [["allure-playwright", { detail: false }]],
};

export default config;
