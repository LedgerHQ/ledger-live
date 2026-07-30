// `workerThreads: true` is required for validating object with `bigint` values
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|tsx)$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  passWithNoTests: true,
  setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup", "@ledgerhq/disable-network-setup"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
    // Type declarations and re-export barrels compile to nothing executable, so
    // istanbul cannot build a coverage object for them and drops them from the
    // report with an error. Left in, they only add noise.
    "!src/types/assets.ts",
    "!src/types/bridge.ts",
    "!src/types/signer.ts",
    "!src/types/index.ts",
    "!src/network/types.ts",
    "!src/index.ts",
    "!src/signer/index.ts",
  ],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../../" }], "text"],
  testPathIgnorePatterns: ["lib/", "lib-es/", ".*\\.integ\\.test\\.[tj]s"],
  workerThreads: true,
  reporters: [
    "default",
    ...(process.env.CI ? ["github-actions"] : []),
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
};
