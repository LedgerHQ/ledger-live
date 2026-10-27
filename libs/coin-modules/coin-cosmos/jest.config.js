const { createLibsCoinJestConfig, createLibsCoinJestProject } = require("@support/jest/libs-coin");

// Two projects: `unit` runs with @ledgerhq/disable-network-setup (nock blocks all net connect), while
// `msw` runs the `.msw.test.ts` suites WITHOUT it — nock and MSW both build on @mswjs/interceptors, so
// they cannot share a run. Both keep wallet-framework-test-setup so getCryptoCurrencyById resolves.
module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  projects: [
    createLibsCoinJestProject({
      displayName: "unit",
      modulePathIgnorePatterns: ["__tests__/fixtures"],
      testPathIgnorePatterns: ["\\.msw\\.test\\.ts"],
    }),
    createLibsCoinJestProject(
      {
        displayName: "msw",
        modulePathIgnorePatterns: ["__tests__/fixtures"],
        testMatch: ["**/*.msw.test.ts"],
      },
      { network: true },
    ),
  ],
});
