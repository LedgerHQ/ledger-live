// SWC transforms both .ts and .js — needed because @ledgerhq/live-common
// publishes ESM-only (lib-es/) and ts-jest doesn't handle it. Mirrors
// e2e/mobile's setup minus the babel-jest layer (we don't need .jsx).
const SWC_CONFIG = {
  jsc: {
    target: "es2022",
    parser: { syntax: "typescript", tsx: false, decorators: true, dynamicImport: true },
  },
  sourceMaps: "inline",
  module: { type: "commonjs" },
};

// Workspace packages live outside node_modules, so transformIgnorePatterns
// doesn't apply to them — but we still need to let the @swc/jest transformer
// see them. The default ignore (everything under node_modules) is fine.
/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: "..",
  testMatch: ["<rootDir>/e2e/**/*.test.ts"],
  testTimeout: 300000,
  // Bump via `DETOX_WORKERS=4 pnpm test:ios` when you have multiple sims booted.
  maxWorkers: Number(process.env.DETOX_WORKERS) || 1,
  transform: {
    "^.+\\.(ts|tsx)$": ["@swc/jest", SWC_CONFIG],
    "^.+\\.(js|mjs|cjs)$": [
      "@swc/jest",
      { ...SWC_CONFIG, jsc: { ...SWC_CONFIG.jsc, parser: { syntax: "ecmascript" } } },
    ],
  },
  globalSetup: "detox/runners/jest/globalSetup",
  globalTeardown: "detox/runners/jest/globalTeardown",
  reporters: ["detox/runners/jest/reporter"],
  testEnvironment: "detox/runners/jest/testEnvironment",
  verbose: true,
};
