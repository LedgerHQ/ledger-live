const path = require("path");
const { createSharedUiNativeJestConfig } = require("@support/jest-shared");

module.exports = createSharedUiNativeJestConfig({
  moduleNameMapper: {
    "^@gorhom/bottom-sheet$": path.join(__dirname, "test/gorhomBottomSheetMock.js"),
  },
});
