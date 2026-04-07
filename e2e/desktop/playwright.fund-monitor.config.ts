// Playwright config for the fund monitor.
// Runs ONLY checkBalance.spec.ts — no global setup, no LLD needed.
// Used by .github/workflows/test-ui-e2e-fund-monitor.yml

import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "./tests",
  testMatch: "**/utils/checkBalance/checkBalance.spec.ts",
  fullyParallel: true,
  workers: "100%",
  retries: 1,
  timeout: 120_000,
  outputDir: "./tests/artifacts/test-results",
  globalTeardown: require.resolve("./tests/utils/checkBalance/teardown"),
  reporter: process.env.CI
    ? [["list"], ["json", { outputFile: "tests/artifacts/fund-monitor-results.json" }]]
    : [["list"]],
};

export default config;
