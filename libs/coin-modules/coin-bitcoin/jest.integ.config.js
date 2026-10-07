/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup"],
  testRegex: ".integ.test.ts$",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  testTimeout: 60_000,
  // The integration suites share the public explorer: run them serially to avoid rate limits.
  maxWorkers: 1,
  forceExit: true,
  passWithNoTests: true,
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
};
