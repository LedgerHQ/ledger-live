import baseConfig from "../../jest.config";

export default {
  ...baseConfig,
  rootDir: __dirname,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
    "!tests/**/*.test.{ts,tsx}",
    "!tests/**/*.spec.{ts,tsx}",
  ],
  coverageReporters: ["json", ["lcov", { projectRoot: "../" }], "json-summary"],
};
