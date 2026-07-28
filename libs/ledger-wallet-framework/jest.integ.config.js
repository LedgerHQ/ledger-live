/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testRegex: ".integration.test.ts$",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup"],
  testTimeout: 90_000,
  forceExit: true,
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
