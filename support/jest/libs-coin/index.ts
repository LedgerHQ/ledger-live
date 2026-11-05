import type { Config } from "@jest/types";
import { presetFactory } from "../core/index.ts";
import { deepFreeze } from "../internals/freeze.ts";
import { NODE_OPTIONS, sharedNodeConfig, withEsmDeps } from "../internals/node.ts";

// Integration suites hit live networks; the unit config leaves them to the integration config.
const integrationTests = ".*\\.(integ|integration)\\.test\\.[tj]s";

/**
 * The lists the unit config sets. Every override replaces the preset's value, as in jest, so a
 * package that extends one of them spreads it:
 *
 *   collectCoverageFrom: [...libsCoinDefaults.collectCoverageFrom, "!src/datasets/**"],
 */
export const libsCoinDefaults = deepFreeze({
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
    "!src/__tests__/**/*.ts",
  ],
  setupFilesAfterEnv: [
    "@ledgerhq/wallet-framework-test-setup",
    "@ledgerhq/disable-network-setup",
    "@ledgerhq/test-quarantine/jest-retries",
  ],
  testPathIgnorePatterns: ["lib/", "lib-es/", "node_modules/", integrationTests],
});

export type LibsCoinOptions = {
  /** applies `withEsmDeps` (default true) */
  esm?: boolean;
  /** more pnpm store prefixes to keep transformed */
  extraEsmDeps?: string[];
  /** lcov root; else derived from `overrides.rootDir`, else `../../../` (a package in libs/coin-modules/) */
  projectRoot?: string;
};

function sharedConfig(
  config: Config.InitialOptions,
  { esm = true, extraEsmDeps, projectRoot }: LibsCoinOptions = {},
): Config.InitialOptions {
  return sharedNodeConfig(config, {
    esm,
    extraEsmDeps,
    projectRoot: projectRoot ?? (config.rootDir === undefined ? "../../../" : undefined),
  });
}

/**
 * Unit config of a coin module: node, the coin setup files (wallet framework, no network, test
 * quarantine retries), integration suites left out, coverage of `src/**` minus the tests.
 *
 * Every key of `overrides` replaces the preset's; `libsCoinDefaults` holds the lists a package
 * extends by spreading them. A key the preset owns throws unless
 * `support/jest/core/preset-overrides.cts` lists it for the package of `overrides.rootDir`.
 *
 *   module.exports = createLibsCoinJestConfig({ rootDir: __dirname });
 */
function unitJestConfig(
  overrides?: Config.InitialOptions,
  options?: LibsCoinOptions,
): Config.InitialOptions {
  return sharedConfig(
    {
      passWithNoTests: true,
      collectCoverageFrom: [...libsCoinDefaults.collectCoverageFrom],
      setupFilesAfterEnv: [...libsCoinDefaults.setupFilesAfterEnv],
      testPathIgnorePatterns: [...libsCoinDefaults.testPathIgnorePatterns],
      ...overrides,
    },
    options,
  );
}

/**
 * One entry of the `projects` of a coin module's unit config, which starts from the unit defaults
 * (node, transform, ESM dependencies, test matching, setup files, ignored paths); why a project
 * needs them: support/jest/README.md. Every key of `overrides` replaces the preset's.
 *
 *   projects: [
 *     createLibsCoinJestProject({ displayName: "unit", testPathIgnorePatterns: [...] }),
 *     createLibsCoinJestProject({ displayName: "msw", setupFilesAfterEnv: [...] }),
 *   ],
 */
function projectJestConfig(
  overrides?: Config.InitialProjectOptions,
  { esm = true, extraEsmDeps = [] }: Pick<LibsCoinOptions, "esm" | "extraEsmDeps"> = {},
): Config.InitialProjectOptions {
  const { testEnvironment, roots, testMatch, transform } = sharedNodeConfig();
  const project: Config.InitialProjectOptions = {
    testEnvironment,
    roots,
    testMatch,
    transform,
    setupFilesAfterEnv: [...libsCoinDefaults.setupFilesAfterEnv],
    testPathIgnorePatterns: [...libsCoinDefaults.testPathIgnorePatterns],
    ...overrides,
  };
  return esm ? withEsmDeps(project, { extraDeps: extraEsmDeps }) : project;
}

/**
 * Integration config of a coin module: the `*.integ.test.ts` suites, which hit live networks,
 * with a 60 s timeout, the wallet framework setup, one retry on CI and the default reporter (no
 * quarantine reporter, no sonar). Every key of `overrides` replaces the preset's.
 *
 *   module.exports = createLibsCoinIntegJestConfig({ rootDir: __dirname });
 */
function integJestConfig(
  overrides?: Config.InitialOptions,
  options?: LibsCoinOptions,
): Config.InitialOptions {
  return sharedConfig(
    {
      testMatch: undefined,
      testRegex: ".integ.test.ts$",
      testTimeout: 60_000,
      forceExit: true,
      passWithNoTests: true,
      setupFilesAfterEnv: [
        "@ledgerhq/wallet-framework-test-setup",
        "@ledgerhq/test-quarantine/jest-retries",
      ],
      reporters: ["default"],
      ...overrides,
    },
    options,
  );
}

export const createLibsCoinJestConfig = presetFactory(
  "createLibsCoinJestConfig",
  NODE_OPTIONS,
  unitJestConfig,
);
export const createLibsCoinIntegJestConfig = presetFactory(
  "createLibsCoinIntegJestConfig",
  NODE_OPTIONS,
  integJestConfig,
);
// A project reads no projectRoot: jest takes the lcov root from the top level.
export const createLibsCoinJestProject = presetFactory(
  "createLibsCoinJestProject",
  ["esm", "extraEsmDeps"],
  projectJestConfig,
);
