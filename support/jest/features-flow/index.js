const path = require("path");
const {
  createDualJestConfig,
  nativeMocks,
  nativeSetupFiles,
  presetFactory,
  webMocks,
  webSetupFiles,
} = require("../core");
const { deepFreeze } = require("../internals/freeze");

// Lumen's shared utils (`cn`, the amount formatters) and its design tokens ship as ESM and are
// real values the views pass around, so SWC has to compile them instead of a stub standing in —
// unlike the component barrels the core maps, which only need to render a DOM node. Entries match
// the pnpm store directory names.
const transformAllowlist = ["@ledgerhq\\+lumen-utils-shared", "@ledgerhq\\+lumen-design-core"];
const transformIgnorePatterns = [`node_modules/.pnpm/(?!(${transformAllowlist.join("|")}))`];

// The core's react-native, Lumen and image stubs, then the native modules a flow reaches.
const flowNativeMocks = deepFreeze({
  ...nativeMocks,
  "^react-native-reanimated$": path.join(__dirname, "mocks/reanimated.js"),
  "^react-native-draggable-flatlist$": path.join(__dirname, "mocks/draggable-flatlist.js"),
  "^react-native-svg(/.*)?$": path.join(__dirname, "mocks/react-native-svg.js"),
  "^react-native-fast-crypto$": path.join(__dirname, "mocks/fast-crypto.js"),
  "^expo-clipboard$": path.join(__dirname, "mocks/expo-clipboard.js"),
  "^@react-navigation/native$": path.join(__dirname, "mocks/react-navigation-native.js"),
  "^@shared/ui-queued-bottom-sheet$": "@shared/ui-queued-bottom-sheet/testing/module-mock",
  "^@shared/ui-queued-bottom-sheet/keyboard$": "@shared/ui-queued-bottom-sheet/testing/module-mock",
});

// The core's web setup, then the flow polyfills.
const flowWebSetupFiles = deepFreeze([...webSetupFiles, path.join(__dirname, "setup/web.js")]);

const flowLayer = {
  depth: "../../../",
  web: {
    transformIgnorePatterns,
    setupFilesAfterEnv: flowWebSetupFiles,
  },
  native: {
    transformIgnorePatterns,
    resolver: path.join(__dirname, "resolver.native.js"),
    moduleNameMapper: flowNativeMocks,
  },
};

/**
 * Dual-project jest config for a features/flow package.
 *
 * - web project: jsdom, matches *.web.test.ts(x) and unsuffixed tests, for Desktop.
 * - native project: node, matches *.native.test.ts(x), for Mobile.
 *
 * Per-project overrides via `webOverrides` / `nativeOverrides`: each key replaces the project's
 * value, as in jest. A package that keeps the project's mocks or setup files spreads the exported
 * `webModuleNameMapper`, `nativeModuleNameMapper`, `webSetupFilesAfterEnv` or
 * `nativeSetupFilesAfterEnv` into its own.
 *
 * @param {{ webOverrides?: object, nativeOverrides?: object } & import('@jest/types').Config.InitialOptions} [overrides]
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function flowJestConfig(overrides) {
  return createDualJestConfig(flowLayer, overrides);
}

/**
 * Jest config for a features/flow package with native-only tests: the native project of
 * createFlowJestConfig(), without the web one. Requires no web-only dependencies
 * (jest-environment-jsdom, @testing-library/jest-dom).
 *
 * @param {{ nativeOverrides?: object } & import('@jest/types').Config.InitialOptions} [overrides]
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function flowNativeJestConfig(overrides) {
  return createDualJestConfig({ ...flowLayer, web: undefined }, overrides);
}

module.exports = {
  createFlowJestConfig: presetFactory("createFlowJestConfig", [], flowJestConfig),
  createFlowNativeJestConfig: presetFactory("createFlowNativeJestConfig", [], flowNativeJestConfig),
  nativeModuleNameMapper: flowNativeMocks,
  nativeSetupFilesAfterEnv: nativeSetupFiles,
  webModuleNameMapper: webMocks,
  webSetupFilesAfterEnv: flowWebSetupFiles,
};
