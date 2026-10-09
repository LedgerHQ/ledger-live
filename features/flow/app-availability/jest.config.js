const path = require("path");

const config = require("@support/jest-features-flow").createFlowJestConfig();

const webProject = config.projects.find(project => project.displayName === "web");
webProject.setupFilesAfterEnv = [
  ...webProject.setupFilesAfterEnv,
  path.resolve(__dirname, "jest/setupUnrefSchedulerMessageChannel.js"),
];

const nativeProject = config.projects.find(project => project.displayName === "native");
nativeProject.moduleNameMapper = {
  ...nativeProject.moduleNameMapper,
  // Native resolver only applies the react-native condition to @features/*; map the dual shared UI.
  "^@shared/ui-app-unavailable$": path.resolve(
    __dirname,
    "../../../shared/ui-app-unavailable/src/index.native.ts",
  ),
};

module.exports = config;
