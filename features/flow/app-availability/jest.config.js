const path = require("path");

module.exports = require("@support/jest/features-flow").createFlowJestConfig({
  webOverrides: {
    setupFilesAfterEnv: [path.resolve(__dirname, "jest/setupUnrefSchedulerMessageChannel.js")],
  },
  nativeOverrides: {
    moduleNameMapper: {
      // Native resolver only applies the react-native condition to @features/*; map the dual shared UI.
      "^@shared/ui-app-unavailable$": path.resolve(
        __dirname,
        "../../../shared/ui-app-unavailable/src/index.native.ts",
      ),
    },
  },
});
