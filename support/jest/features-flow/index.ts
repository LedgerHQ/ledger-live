import type { Config } from "@jest/types";
import {
  createDualJestConfig,
  nativeMocks,
  nativeSetupFiles,
  presetFactory,
  webMocks,
  webSetupFiles,
  type DualLayer,
  type DualOverrides,
} from "../core/index.ts";
import { deepFreeze } from "../internals/freeze.ts";
import { joinPresetPath } from "../internals/join-preset-path.ts";

const flowPath = (file: string) => joinPresetPath(import.meta.dirname, file);

// Lumen's shared utils (`cn`, the amount formatters) and its design tokens ship as ESM and are
// real values the views pass around, so SWC has to compile them instead of a stub standing in —
// unlike the component barrels the core maps, which only need to render a DOM node. Entries match
// the pnpm store directory names.
const transformAllowlist = ["@ledgerhq\\+lumen-utils-shared", "@ledgerhq\\+lumen-design-core"];
const transformIgnorePatterns = [`node_modules/.pnpm/(?!(${transformAllowlist.join("|")}))`];

// The core's react-native, Lumen and image stubs, then the native modules a flow reaches.
const flowNativeMocks: Record<string, string> = deepFreeze({
  ...nativeMocks,
  "^react-native-reanimated$": flowPath("mocks/reanimated.js"),
  "^react-native-draggable-flatlist$": flowPath("mocks/draggable-flatlist.js"),
  "^react-native-svg(/.*)?$": flowPath("mocks/react-native-svg.js"),
  "^react-native-fast-crypto$": flowPath("mocks/fast-crypto.js"),
  "^expo-clipboard$": flowPath("mocks/expo-clipboard.js"),
  "^@react-navigation/native$": flowPath("mocks/react-navigation-native.js"),
  "^@shared/ui-queued-bottom-sheet$": "@shared/ui-queued-bottom-sheet/testing/module-mock",
  "^@shared/ui-queued-bottom-sheet/keyboard$": "@shared/ui-queued-bottom-sheet/testing/module-mock",
});

// The core's web setup, then the flow polyfills.
const flowWebSetupFiles: string[] = deepFreeze([...webSetupFiles, flowPath("setup/web.js")]);

const flowLayer: DualLayer = {
  depth: "../../../",
  web: {
    transformIgnorePatterns,
    setupFilesAfterEnv: flowWebSetupFiles,
  },
  native: {
    transformIgnorePatterns,
    resolver: flowPath("resolver.native.js"),
    moduleNameMapper: flowNativeMocks,
  },
};

/**
 * Dual-project jest config for a features/flow package.
 *
 * - web project: jsdom, matches *.web.test.ts(x) and unsuffixed tests, for Desktop.
 * - native project: node, matches *.native.test.ts(x), for Mobile.
 *
 * Per-project overrides via `webOverrides` / `nativeOverrides`, by the override rule of the
 * `@support/jest` README.
 */
function flowJestConfig(overrides?: DualOverrides): Config.InitialOptions {
  return createDualJestConfig(flowLayer, overrides);
}

/**
 * Jest config for a features/flow package with native-only tests: the native project of
 * createFlowJestConfig(), without the web one. Requires no web-only dependencies
 * (jest-environment-jsdom, @testing-library/jest-dom).
 */
function flowNativeJestConfig(
  overrides?: Omit<DualOverrides, "webOverrides">,
): Config.InitialOptions {
  return createDualJestConfig({ ...flowLayer, web: undefined }, overrides);
}

export const createFlowJestConfig = presetFactory("createFlowJestConfig", [], flowJestConfig);
export const createFlowNativeJestConfig = presetFactory(
  "createFlowNativeJestConfig",
  [],
  flowNativeJestConfig,
);
export {
  flowNativeMocks as nativeModuleNameMapper,
  nativeSetupFiles as nativeSetupFilesAfterEnv,
  webMocks as webModuleNameMapper,
  flowWebSetupFiles as webSetupFilesAfterEnv,
};
