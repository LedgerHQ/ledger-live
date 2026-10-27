const { createLibsCoinJestConfig, createLibsCoinJestProject } = require("@support/jest/libs-coin");

// Two projects: `unit` runs with @ledgerhq/disable-network-setup (nock blocks all net connect),
// while `msw` runs the `.msw.test.ts` suites WITHOUT it -- nock and MSW both build on
// @mswjs/interceptors, so they cannot share the same run. Mirrors coin-kaspa/coin-vechain.
module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  coveragePathIgnorePatterns: ["src/test", "src/types", "src/index.ts"],
  projects: [
    createLibsCoinJestProject({
      displayName: "unit",
      testPathIgnorePatterns: ["\\.msw\\.test\\.ts"],
    }),
    createLibsCoinJestProject(
      {
        displayName: "msw",
        testMatch: ["**/*.msw.test.ts"],
        setupFiles: ["@ledgerhq/wallet-framework-test-setup", "./src/test/msw-setup.ts"],
      },
      { network: true, walletFramework: false },
    ),
  ],
});
