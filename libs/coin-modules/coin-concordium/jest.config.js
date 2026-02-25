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
  setupFiles: ["<rootDir>/jest.setup.js"],
  setupFilesAfterEnv: ["@ledgerhq/disable-network-setup"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
  ],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../../" }], "text"],
  testPathIgnorePatterns: ["lib/", "lib-es/", ".*\\.integ\\.test\\.[tj]s"],
  transformIgnorePatterns: [
    "node_modules/(?!(@walletconnect)/)",
  ],
  workerThreads: true,
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
};
