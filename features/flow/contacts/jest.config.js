const { createFlowJestConfig } = require("@features/platform-jest-config");

const config = createFlowJestConfig();
const nativeConfig = config.projects.find(project => project.displayName === "native");

nativeConfig.moduleNameMapper["^@features/platform-address-validation$"] =
  "<rootDir>/../../platform/address-validation/src/index.native.ts";

module.exports = config;
