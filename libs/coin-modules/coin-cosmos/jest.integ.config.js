/** @type {import('jest').Config} */
const { mswEsmPnpmDirs, mswTransform } = require("@support/jest-msw");
module.exports = {
  testEnvironment: "node",
  testRegex: ".integ.test.ts$",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  testTimeout: 60_000,
  maxWorkers: 1,
  forceExit: true,
  setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup"],
  transformIgnorePatterns: [`node_modules/.pnpm/(?!(${mswEsmPnpmDirs.join("|")}))`],
  transform: {
    ...mswTransform,
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
