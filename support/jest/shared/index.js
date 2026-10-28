const {
  createDualJestConfig,
  jestSonarReporter,
  lcovCoverageReporters,
  lcovRoot,
  nativeMocks,
  platformExtensions,
  quarantineReporter,
  quarantineRetries,
  swcTransform,
  withProjectOverrides,
} = require("../core");

/**
 * Tail reporters shared by every config. Exported so callers that need to insert an extra
 * reporter (e.g. github-actions) can spread this after their insertion:
 *
 *   reporters: ["default", ...(CI ? ["github-actions"] : []), ...sharedReporters]
 */
const sharedReporters = [jestSonarReporter, quarantineReporter];

// ─── ESM-only dependencies ──────────────────────────────────────────────────

/**
 * ESM-only packages that CJS code reaches through `require`, and that jest has to transform.
 * Matched against pnpm's store directory name, where a scope separator becomes a `+`
 * (`@noble+hashes@2.4.0`), hence the escaped `\\+`.
 */
const esmDeps = ["@noble\\+"];

/**
 * Makes jest transform ESM-only dependencies instead of failing with
 * `Must use import to load ES Module` when a CJS package `require`s them (e.g. `@noble/hashes` 2.x).
 *
 * Everything else in node_modules/.pnpm stays ignored. Merges into `config.transform` and replaces
 * `config.transformIgnorePatterns`.
 *
 *   module.exports = withEsmDeps({ testEnvironment: "node" });
 *   module.exports = withEsmDeps(config, { extraDeps: ["@ledgerhq\\+"] }); // also keep these transformed
 *
 * @param {import('@jest/types').Config.InitialOptions} config
 * @param {{ extraDeps?: string[] }} [options]
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function withEsmDeps(config, { extraDeps = [] } = {}) {
  const deps = [...esmDeps, ...extraDeps].join("|");
  return {
    ...config,
    transform: {
      ...config.transform,
      [`node_modules[\\\\/]\\.pnpm[\\\\/](${esmDeps.join("|")}).+\\.(js|mjs)$`]: [
        "@swc/jest",
        { jsc: { target: "esnext" } },
      ],
    },
    transformIgnorePatterns: [`node_modules[\\\\/]\\.pnpm[\\\\/](?!(${deps}))`],
  };
}

// ─── shared/* and libs/* (node packages) ────────────────────────────────────

/**
 * Flat jest config for a node package: shared/* logic packages, and libs/* packages.
 *
 * `esm: true` applies `withEsmDeps` (with `extraEsmDeps`) to the result, after the overrides. The
 * lcov `projectRoot` is the option when given, else derived from `overrides.rootDir` when set, else
 * `../../` (a package two levels below the repository root).
 *
 *   module.exports = createSharedJestConfig();
 *   module.exports = createSharedJestConfig({ rootDir: __dirname }, { esm: true });
 *
 * @param {import('@jest/types').Config.InitialOptions} [overrides]
 * @param {{ esm?: boolean, extraEsmDeps?: string[], projectRoot?: string }} [options]
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createSharedJestConfig(
  overrides = {},
  { esm = false, extraEsmDeps = [], projectRoot } = {},
) {
  const config = {
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    testMatch: ["**/*.test.ts"],
    testPathIgnorePatterns: ["lib/", "lib-es/", "node_modules/"],
    transform: swcTransform,
    coverageDirectory: "./coverage/",
    coverageReporters: lcovCoverageReporters(projectRoot ?? lcovRoot(overrides.rootDir, "../../")),
    reporters: ["default", ...(process.env.CI ? ["github-actions"] : []), ...sharedReporters],
    setupFilesAfterEnv: [quarantineRetries],
    ...overrides,
  };
  return esm ? withEsmDeps(config, { extraDeps: extraEsmDeps }) : config;
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
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createSharedUiJestConfig(options) {
  return createDualJestConfig(
    { depth: "../../", web: lumenTransform, native: lumenTransform },
    options,
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
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createSharedUiNativeJestConfig(overrides = {}) {
  return createSharedJestConfig(
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
