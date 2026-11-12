import type { Config } from "@jest/types";
import {
  createDualJestConfig,
  jestSonarReporter,
  nativeMocks,
  nativeSetupFiles,
  platformExtensions,
  presetFactory,
  webMocks,
  webSetupFiles,
  withProjectOverrides,
  type DualOverrides,
} from "../core/index.ts";
import { NODE_OPTIONS, sharedNodeConfig, sharedReporters, withEsmDeps } from "../internals/node.ts";

// ─── shared/* and libs/* (node packages) ────────────────────────────────────

/**
 * Flat jest config for a node package: shared/* logic packages, and libs/* packages.
 *
 * `esm: true` applies `withEsmDeps` (with `extraEsmDeps`) to the result, after the overrides. The
 * lcov `projectRoot` is the option when given, else derived from `overrides.rootDir` when set, else
 * `../../` (a package two levels below the repository root).
 *
 * A key the preset owns (`transform`, `testEnvironment`, `reporters`, ...) throws unless
 * `support/jest/core/preset-overrides.cts` lists it for the package of `overrides.rootDir`.
 *
 *   module.exports = createSharedJestConfig();
 *   module.exports = createSharedJestConfig({ rootDir: __dirname }, { esm: true });
 */
export const createSharedJestConfig = presetFactory(
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
 * Per-project overrides via `webOverrides` / `nativeOverrides`, by the override rule of the
 * `@support/jest` README.
 */
function sharedUiJestConfig(overrides?: DualOverrides): Config.InitialOptions {
  return createDualJestConfig(
    { depth: "../../", web: lumenTransform, native: lumenTransform },
    overrides,
  );
}

/**
 * Jest config for a shared/ui-* package with native-only tests (*.native.test.ts).
 *
 * Provides react-native, safe-area-context, Lumen native, and image stubs by default; overrides
 * follow the override rule of the `@support/jest` README. Requires no web-only dependencies
 * (jest-environment-jsdom, @testing-library/jest-dom).
 */
function sharedUiNativeJestConfig(overrides: Config.InitialOptions = {}): Config.InitialOptions {
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

export const createSharedUiJestConfig = presetFactory(
  "createSharedUiJestConfig",
  [],
  sharedUiJestConfig,
);
export const createSharedUiNativeJestConfig = presetFactory(
  "createSharedUiNativeJestConfig",
  [],
  sharedUiNativeJestConfig,
);

export {
  jestSonarReporter,
  nativeMocks as nativeModuleNameMapper,
  nativeSetupFiles as nativeSetupFilesAfterEnv,
  sharedReporters,
  webMocks as webModuleNameMapper,
  webSetupFiles as webSetupFilesAfterEnv,
  withEsmDeps,
};
