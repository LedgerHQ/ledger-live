const path = require("path");
const { createSharedUiNativeJestConfig, nativeModuleNameMapper } = require("@support/jest/shared");

module.exports = createSharedUiNativeJestConfig({
  moduleNameMapper: {
    ...nativeModuleNameMapper,
    "^@gorhom/bottom-sheet$": path.join(__dirname, "test/gorhomBottomSheetMock.js"),
  },
});
