const path = require("path");
const { createFlowJestConfig } = require("@support/jest-features-flow");

// RN-only package: native implementations live in *.native.ts(x), resolved via moduleFileExtensions
// (mirrors tsconfig moduleSuffixes). Keep only the native jest project.
//
// Map Lumen + safe-area to in-package stubs (same idea as shared/qr-code and contacts' harness):
// the support/ passthrough cannot resolve `react` when this package is installed filtered in CI.
const config = createFlowJestConfig();

module.exports = {
  ...config,
  projects: config.projects
    .filter(project => project.displayName === "native")
    .map(project => ({
      ...project,
      moduleFileExtensions: ["native.tsx", "native.ts", "tsx", "ts", "js", "jsx", "json"],
      moduleNameMapper: {
        ...project.moduleNameMapper,
        "^@ledgerhq/lumen-ui-rnative(/.*)?$": path.join(
          __dirname,
          "jest/mocks/passthrough-native.js",
        ),
        "^react-native-safe-area-context$": path.join(__dirname, "jest/mocks/safe-area-context.js"),
      },
    })),
};
