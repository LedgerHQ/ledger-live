const path = require("path");
const { sharedReporters, withEsmDeps } = require("../shared");

const repositoryRoot = path.resolve(__dirname, "../../..");

const swcTransform = {
  "^.+\\.(ts|tsx)?$": ["@swc/jest", { jsc: { target: "esnext" } }],
};

/**
 * Flat node jest config for a lib package (`libs/*`, or a node package of another layer that no
 * layer preset covers), with ESM-only dependencies transformed through `withEsmDeps`.
 *
 * Overrides replace the preset's keys. `setupFilesAfterEnv` is the one a caller usually appends
 * to: list `@ledgerhq/test-quarantine/jest-retries` again before its own setup files.
 *
 * lcov paths are relative to the repository root, which the preset derives from `rootDir`: pass
 * `rootDir: __dirname`, or the lcov reporter's `projectRoot` as an option.
 *
 *   module.exports = createLibJestConfig({ rootDir: __dirname });
 *   module.exports = createLibJestConfig({ rootDir: __dirname }, { extraEsmDeps: ["@ledgerhq\\+"] });
 *
 * @param {import('@jest/types').Config.InitialOptions} overrides
 * @param {{ extraEsmDeps?: string[], projectRoot?: string }} [options]
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createLibJestConfig(overrides, { extraEsmDeps = [], projectRoot } = {}) {
  if (projectRoot === undefined && overrides?.rootDir === undefined) {
    throw new Error("createLibJestConfig: pass `rootDir: __dirname` or the `projectRoot` option");
  }
  const lcovRoot = projectRoot ?? `${path.relative(overrides.rootDir, repositoryRoot)}/`;

  return withEsmDeps(
    {
      testEnvironment: "node",
      testPathIgnorePatterns: ["lib/", "lib-es/"],
      transform: swcTransform,
      coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: lcovRoot }], "text"],
      reporters: ["default", ...(process.env.CI ? ["github-actions"] : []), ...sharedReporters],
      setupFilesAfterEnv: ["@ledgerhq/test-quarantine/jest-retries"],
      ...overrides,
    },
    { extraDeps: extraEsmDeps },
  );
}

module.exports = { createLibJestConfig };
