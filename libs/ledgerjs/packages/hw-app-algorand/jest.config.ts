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
  coverageReporters: ["json", ["lcov", { projectRoot: "../" }], "json-summary", "text"],
  reporters: [
    [
      "jest-sonar",
      {
        outputName: "hw-app-algorand-sonar-executionTests-report.xml",
        reportedFilePath: "absolute",
      },
    ],
  ],
};
