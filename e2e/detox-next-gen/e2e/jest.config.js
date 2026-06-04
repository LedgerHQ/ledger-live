/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: "ts-jest", // (1)

  rootDir: "..",
  testMatch: ["<rootDir>/e2e/**/*.test.ts"],
  testTimeout: 120000,
  // Bump via `DETOX_WORKERS=4 pnpm test:ios` when you have multiple sims booted.
  maxWorkers: Number(process.env.DETOX_WORKERS) || 1,
  globalSetup: "detox/runners/jest/globalSetup",
  globalTeardown: "detox/runners/jest/globalTeardown",
  reporters: ["detox/runners/jest/reporter"],
  testEnvironment: "detox/runners/jest/testEnvironment",
  verbose: true,
};
