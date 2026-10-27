const { createLibsCoinJestConfig, createLibsCoinJestProject } = require("@support/jest/libs-coin");

module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  collectCoverageFrom: ["!src/test/**", "!src/index.ts"],
  projects: [
    createLibsCoinJestProject({
      displayName: "unit",
      testPathIgnorePatterns: [".*\\.msw\\.test\\.[tj]s"],
      // `workerThreads: true` is required for validating objects with `bigint` values
      workerThreads: true,
    }),
    createLibsCoinJestProject(
      {
        displayName: "msw",
        testMatch: ["**/*.msw.test.ts"],
        setupFiles: ["./src/test/helpers/msw-setup.ts"],
        workerThreads: true,
      },
      { network: true },
    ),
  ],
});
