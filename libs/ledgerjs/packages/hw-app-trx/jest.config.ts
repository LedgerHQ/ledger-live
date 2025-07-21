import baseConfig from "../../jest.config";

export default {
  ...baseConfig,
  rootDir: __dirname,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
    "!src/**/__tests__/**",
    "!tests/**",
  ],
  coverageReporters: [
    "json",
    ["lcov", { file: "lcov.info", projectRoot: "../../../../" }],
    "json-summary",
    "text",
  ],
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
};
