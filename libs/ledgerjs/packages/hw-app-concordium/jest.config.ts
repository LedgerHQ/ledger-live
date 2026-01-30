import baseConfig from "../../jest.config";

export default {
  ...baseConfig,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
    "!src/**/__tests__/**",
  ],
  coverageReporters: ["json", ["lcov", { projectRoot: "../../../../" }], "json-summary", "text"],
  reporters: [
    "default",
    [
      "jest-sonar",
      {
        outputName: "sonar-executionTests-report.xml",
        reportedFilePath: "absolute",
      },
    ],
  ],
};

