const {
  createDualJestConfig,
  jestSonarReporter,
  nativeMocks,
  nativeSetupFiles,
  platformExtensions,
  presetFactory,
  webMocks,
  webSetupFiles,
  withProjectOverrides,
} = require("../core");
const {
  NODE_OPTIONS,
  sharedNodeConfig,
  sharedReporters,
  withEsmDeps,
} = require("../internals/node");

// ─── shared/* and libs/* (node packages) ────────────────────────────────────

/**
 * Flat jest config for a node package: shared/* logic packages, and libs/* packages.
 *
 * `esm: true` applies `withEsmDeps` (with `extraEsmDeps`) to the result, after the overrides. The
 * lcov `projectRoot` is the option when given, else derived from `overrides.rootDir` when set, else
 * `../../` (a package two levels below the repository root).
 *
 * A key the preset owns (`transform`, `testEnvironment`, `reporters`, ...) throws unless
 * `support/jest/core/preset-overrides.js` lists it for the package of `overrides.rootDir`.
 *
 *   module.exports = createSharedJestConfig();
 *   module.exports = createSharedJestConfig({ rootDir: __dirname }, { esm: true });
 */
const createSharedJestConfig = presetFactory(
  "createSharedJestConfig",
  NODE_OPTIONS,
  sharedNodeConfig,
);

// ─── shared/ui-* (UI packages) ──────────────────────────────────────────────

// Lumen's shared utils (`cn`) and design tokens ship as ESM and are real values, not stubs, so SWC
// compiles them. Entries match the pnpm store directory names.
const lumenTransformAllowlist = ["@ledgerhq\\+lumen-utils-shared", "@ledgerhq\\+lumen-design-core"];
const lumenTransform = {
  transformIgnorePatterns: [`node_modules/.pnpm/(?!(${lumenTransformAllowlist.join("|")}))`],
};

/**
 * Dual-project jest config for a shared/ui-* package with web and native tests.
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
function sharedUiJestConfig(overrides) {
  return createDualJestConfig(
    { depth: "../../", web: lumenTransform, native: lumenTransform },
    overrides,
  );
}

/**
 * Jest config for a shared/ui-* package with native-only tests (*.native.test.ts).
 *
 * Provides react-native, safe-area-context, Lumen native, and image stubs by default. Each override
 * key replaces the preset's, as in jest: a package that keeps the stubs spreads the exported
 * `nativeModuleNameMapper` into its own. Requires no web-only dependencies
 * (jest-environment-jsdom, @testing-library/jest-dom).
 *
 * @param {{ moduleNameMapper?: object } & import('@jest/types').Config.InitialOptions} [overrides]
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function sharedUiNativeJestConfig(overrides = {}) {
  return sharedNodeConfig(
    withProjectOverrides(
      {
        collectCoverage: true,
        testMatch: ["**/*.native.test.ts?(x)", "**/*.native.spec.ts?(x)"],
        moduleFileExtensions: platformExtensions("native"),
        moduleNameMapper: nativeMocks,
        setupFilesAfterEnv: nativeSetupFiles,
      },
      overrides,
    ),
  );
}

module.exports = {
  createSharedJestConfig,
  createSharedUiJestConfig: presetFactory("createSharedUiJestConfig", [], sharedUiJestConfig),
  createSharedUiNativeJestConfig: presetFactory(
    "createSharedUiNativeJestConfig",
    [],
    sharedUiNativeJestConfig,
  ),
  jestSonarReporter,
  nativeModuleNameMapper: nativeMocks,
  nativeSetupFilesAfterEnv: nativeSetupFiles,
  sharedReporters,
  webModuleNameMapper: webMocks,
  webSetupFilesAfterEnv: webSetupFiles,
  withEsmDeps,
};
