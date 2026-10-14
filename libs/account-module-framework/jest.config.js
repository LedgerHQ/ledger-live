module.exports = {
  passWithNoTests: true,
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.test.ts", "!src/**/index.ts"],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../" }], "text"],
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": ["@swc/jest", { jsc: { target: "esnext" } }],
  },
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  reporters: [
    "default",
    ...(process.env.CI ? ["github-actions"] : []),
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
    "@ledgerhq/test-quarantine/jest",
  ],
  setupFilesAfterEnv: ["@ledgerhq/test-quarantine/jest-retries"],
};
