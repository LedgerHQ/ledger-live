/**
 * Jest config for the Maestro backend harness.
 *
 * Why Jest? The e2e/mobile code uses TS path aliases (`@shared/*`, `~/*`, the
 * `@ledgerhq/live-common/e2e/*` mapping) and the `jest-allure2-reporter` runtime.
 * Plain `tsx`/`node` can't resolve those. This config reuses the package's exact
 * transform + alias resolution from ../../jest.config.js, but DROPS every Detox
 * bit (globalSetup / setup.ts / detox environment + reporter) so it does NOT
 * launch the app — Maestro launches the app (see ../subflows/launch-seeded.yaml).
 */
const path = require("path");
const base = require("../../jest.config.js");

// Force "axios" to resolve to its Node build. The base config sets
// testEnvironmentOptions.customConditions = ["node"], which REPLACES Jest's default export
// conditions (drops "require"), so axios's package `exports` can resolve to its non-node build
// — whose adapter list is ['xhr','fetch'] (no http). With no XMLHttpRequest in this bare-node
// harness, axios then uses the fetch/undici adapter, which fails against the Docker-forwarded
// Speculos API port (ECONNREFUSED/"network error") even though raw http to the same port works.
// Pinning the node build (http adapter) fixes the Speculos screen-polling in the swap signer.
const axiosNodeBuild = require.resolve("axios", {
  paths: [path.resolve(__dirname, "../../../../libs/ledger-live-common")],
});

module.exports = {
  ...base,
  // rootDir resolves relative to THIS file -> e2e/mobile, matching the base's
  // <rootDir>/... mappings and the relative `userdata/` paths used at runtime.
  rootDir: "../..",
  // Maestro owns the device, so stub Detox (its `device` port-forwarding needs a
  // Detox worker and is a no-op on iOS). Keep the base alias mappings.
  moduleNameMapper: {
    ...base.moduleNameMapper,
    "^detox$": "<rootDir>/maestro/harness/detox-stub.ts",
    "^axios$": axiosNodeBuild,
  },
  // No Detox app launch; instead, recreate the globals jest.environment.ts would set.
  setupFilesAfterEnv: ["<rootDir>/maestro/harness/setup-globals.ts"],
  globalSetup: undefined,
  globalTeardown: undefined,
  testEnvironment: "node", // not DetoxEnvironment
  testEnvironmentOptions: { customConditions: ["node"] },
  reporters: ["default"], // no detox reporter
  testMatch: ["<rootDir>/maestro/harness/backend.test.ts"],
  // The "test" intentionally never resolves — it keeps the bridge alive while
  // Maestro drives the app. The orchestrator (../run-eth.sh) kills it on exit.
  testTimeout: 6_000_000,
};
