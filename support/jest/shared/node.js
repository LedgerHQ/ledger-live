// Internals of the node presets, required by @support/jest/shared and @support/jest/libs-coin and
// left out of the package exports: sharedNodeConfig() skips the check createSharedJestConfig()
// runs on a package's overrides.
const {
  jestSonarReporter,
  lcovCoverageReporters,
  lcovRoot,
  quarantineReporter,
  quarantineRetries,
  swcTransform,
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

/**
 * The flat node config createSharedJestConfig() returns, without the check of its overrides, for
 * the presets built on it, which set some of the keys the preset owns.
 *
 * @param {import('@jest/types').Config.InitialOptions} [overrides]
 * @param {{ esm?: boolean, extraEsmDeps?: string[], projectRoot?: string }} [options]
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function sharedNodeConfig(overrides = {}, { esm = false, extraEsmDeps = [], projectRoot } = {}) {
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

module.exports = { sharedNodeConfig, sharedReporters, withEsmDeps };
