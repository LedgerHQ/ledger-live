const { createFlowJestConfig } = require("@support/jest-features-flow");

const config = createFlowJestConfig();
const native = config.projects.find(p => p.displayName === "native");
native.testEnvironment = "jsdom";
native.setupFilesAfterEnv = ["@testing-library/jest-dom"];

module.exports = config;
