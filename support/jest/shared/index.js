const {
  checkOptions,
  checkPresetOverrides,
  createDualJestConfig,
  jestSonarReporter,
  nativeMocks,
  platformExtensions,
  quarantineRetries,
  withProjectOverrides,
} = require("../core");
const { sharedNodeConfig, sharedReporters, withEsmDeps } = require("./node");

const NODE_OPTIONS = ["esm", "extraEsmDeps", "projectRoot"];

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
 *
 * @param {import('@jest/types').Config.InitialOptions} [overrides]
 * @param {{ esm?: boolean, extraEsmDeps?: string[], projectRoot?: string }} [options]
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createSharedJestConfig(overrides = {}, options) {
  checkOptions("createSharedJestConfig", options, NODE_OPTIONS);
  checkPresetOverrides(
    "createSharedJestConfig",
    { "": overrides },
    overrides.rootDir,
    NODE_OPTIONS,
  );
  return sharedNodeConfig(overrides, options);
}

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
 * Per-project overrides via `webOverrides` / `nativeOverrides`: `setupFilesAfterEnv` and
 * `moduleNameMapper` add to the project's defaults, any other key replaces them.
 *
 * @param {{ webOverrides?: object, nativeOverrides?: object } & import('@jest/types').Config.InitialOptions} [options]
 * @param {Record<string, never>} [extra] none: the factory takes no options, and throws on one
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createSharedUiJestConfig(options, extra) {
  checkOptions("createSharedUiJestConfig", extra, []);
  return createDualJestConfig(
    { depth: "../../", web: lumenTransform, native: lumenTransform },
    options,
    "createSharedUiJestConfig",
  );
}

/**
 * Jest config for a shared/ui-* package with native-only tests (*.native.test.ts).
 *
 * Provides react-native, safe-area-context, Lumen native, and image stubs by default.
 * `moduleNameMapper` and `setupFilesAfterEnv` overrides add to the preset's (an entry with the
 * same pattern replaces that mock); any other key replaces it. Requires no web-only dependencies (jest-environment-jsdom, @testing-library/jest-dom).
 *
 * @param {{ moduleNameMapper?: object } & import('@jest/types').Config.InitialOptions} [overrides]
 * @param {Record<string, never>} [options] none: the factory takes no options, and throws on one
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createSharedUiNativeJestConfig(overrides = {}, options) {
  checkOptions("createSharedUiNativeJestConfig", options, []);
  checkPresetOverrides("createSharedUiNativeJestConfig", { "": overrides }, overrides.rootDir);
  return sharedNodeConfig(
    withProjectOverrides(
      {
        collectCoverage: true,
        testMatch: ["**/*.native.test.ts?(x)", "**/*.native.spec.ts?(x)"],
        moduleFileExtensions: platformExtensions("native"),
        moduleNameMapper: { ...nativeMocks },
        setupFilesAfterEnv: [quarantineRetries],
      },
      overrides,
    ),
  );
}

module.exports = {
  createSharedJestConfig,
  createSharedUiJestConfig,
  createSharedUiNativeJestConfig,
  jestSonarReporter,
  sharedReporters,
  withEsmDeps,
};
