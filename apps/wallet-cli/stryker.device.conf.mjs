// Local-only mutation testing for wallet-cli device code.
//
// This is intentionally NOT wired into CI, Nx targets, or the repo validation
// docs. Run it manually from this package while strengthening device tests:
//
//   pnpm --filter @ledgerhq/wallet-cli mutate:device
//
// It uses the Bun Stryker runner (https://github.com/hughescr/stryker-bun-runner)
// because the package runs its tests with `bun test`. Requires Bun >= 1.3.7.

// Resolve the Bun runner to an absolute entrypoint. In this pnpm monorepo
// Stryker core runs from a hoisted location and cannot resolve the plugin by
// its bare package name. The package is ESM-only (no CJS "require" export), so
// use ESM resolution to honour its "import" condition.
const bunRunnerPlugin = import.meta.resolve("@hughescr/stryker-bun-runner");

/** @type {import("@stryker-mutator/core").PartialStrykerOptions} */
export default {
  testRunner: "bun",
  coverageAnalysis: "perTest",

  // The Bun runner lives outside the default "@stryker-mutator/*" plugin glob,
  // so it must be registered explicitly (keep the default glob for the built-in
  // reporters and mutators).
  plugins: ["@stryker-mutator/*", bunRunnerPlugin],

  // Mutate in place rather than in a copied sandbox: the pnpm monorepo relies on
  // symlinked workspace packages and nested node_modules that do not survive a
  // naive sandbox copy. Stryker restores the originals when the run finishes.
  // Because files are mutated in place, runners cannot share them — keep
  // concurrency at 1.
  inPlace: true,
  concurrency: 1,

  // First pass: the highest-risk connection code only. Widen this list (or
  // switch to "src/device/**/*.ts") once the baseline survivors are triaged.
  mutate: [
    "src/device/node-webusb/NodeWebUsbTransport.ts",
    "src/device/node-webusb/NodeWebUsbApduSender.ts",
    "src/device/connect-ledger-app.ts",
  ],

  bun: {
    // Restrict the runner to the device suites that exercise the mutated files,
    // so a mutation run never executes unrelated wallet-cli tests.
    testFiles: [
      "src/device/node-webusb/NodeWebUsbTransport.test.ts",
      "src/device/node-webusb/NodeWebUsbApduSender.test.ts",
      "src/device/connect-ledger-app.test.ts",
    ],
  },

  reporters: ["clear-text", "progress", "html"],
  htmlReporter: { fileName: "reports/mutation/device.html" },

  // No enforced threshold yet — establish a baseline first, then ratchet `high`
  // and `break` up as the device suites get stronger.
  thresholds: { high: 80, low: 60, break: null },
};
