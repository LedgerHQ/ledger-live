const path = require("path");
const {
  createFlowJestConfig,
  nativeModuleNameMapper,
  nativeSetupFilesAfterEnv,
} = require("@support/jest/features-flow");

const testFile = file => path.resolve(__dirname, "src/__tests__", file);

module.exports = createFlowJestConfig({
  nativeOverrides: {
    moduleNameMapper: {
      ...nativeModuleNameMapper,
      // The device-action animation: no native Lottie module in a node env.
      "^@shared/lottie/native$": testFile("mocks/lottie.native.tsx"),
      "^react-native-config$": testFile("mocks/reactNativeConfig.ts"),
    },
    setupFilesAfterEnv: [...nativeSetupFilesAfterEnv, testFile("setup.native.ts")],
  },
});
