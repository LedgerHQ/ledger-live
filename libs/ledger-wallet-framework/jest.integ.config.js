/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testRegex: ".integration.test.ts$",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  setupFilesAfterEnv: ["<rootDir>/../wallet-framework-test-setup/src/index.js"],
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
