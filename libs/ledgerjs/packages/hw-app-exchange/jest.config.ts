import baseConfig from "../../jest.config";

export default {
  ...baseConfig,
  rootDir: __dirname,
  testPathIgnorePatterns: [...baseConfig.testPathIgnorePatterns, ".*\\.integ\\.test\\.[tj]s"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
    "!src/**/__integration__/**",
    "!src/**/__integrations__/**",
    "!src/**/__tests__/**",
  ],
  coverageReporters: ["json", ["lcov", { projectRoot: "../" }], "json-summary"],
};
