const path = require("path");
const {
  createFlowJestConfig,
  nativeModuleNameMapper,
  webSetupFilesAfterEnv,
} = require("@support/jest/features-flow");

module.exports = createFlowJestConfig({
  webOverrides: {
    setupFilesAfterEnv: [
      ...webSetupFilesAfterEnv,
      path.resolve(__dirname, "jest/setupUnrefSchedulerMessageChannel.js"),
    ],
  },
  nativeOverrides: {
    moduleNameMapper: {
      ...nativeModuleNameMapper,
      // Native resolver only applies the react-native condition to @features/*; map the dual shared UI.
      "^@shared/ui-app-unavailable$": path.resolve(
        __dirname,
        "../../../shared/ui-app-unavailable/src/index.native.ts",
      ),
    },
  },
});
