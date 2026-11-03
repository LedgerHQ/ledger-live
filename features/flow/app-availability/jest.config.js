const path = require("path");
const { createFlowJestConfig, nativeModuleNameMapper } = require("@support/jest/features-flow");

module.exports = createFlowJestConfig({
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
