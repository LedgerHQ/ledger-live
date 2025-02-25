import baseConfig from "../../jest.config";

export default {
  ...baseConfig,
  rootDir: __dirname,
  coverageReporters: ["json", ["lcov", { projectRoot: "../" }], "json-summary", "text"],
};
