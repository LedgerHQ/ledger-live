// Internals of the node presets, imported by @support/jest/shared and @support/jest/libs-coin and
// left out of the package exports: sharedNodeConfig() skips the check createSharedJestConfig()
// runs on a package's overrides.
import type { Config } from "@jest/types";
import {
  freshReporters,
  jestSonarReporter,
  lcovCoverageReporters,
  lcovRoot,
  quarantineReporter,
  quarantineRetries,
  swcTransform,
} from "../core/index.ts";
import { deepFreeze } from "./freeze.ts";

type Options = Config.InitialOptions;

/** The options of the node factories. */
export type NodeOptions = { esm?: boolean; extraEsmDeps?: string[]; projectRoot?: string };

// Tail reporters of every node config. The preset sets `reporters`; a package cannot override them.
export const sharedReporters: NonNullable<Options["reporters"]> = deepFreeze([
  jestSonarReporter,
  quarantineReporter,
]);

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
 */
export function withEsmDeps(
  config: Options,
  { extraDeps = [] }: { extraDeps?: string[] } = {},
): Options {
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
 */
export function sharedNodeConfig(
  overrides: Options = {},
  { esm = false, extraEsmDeps = [], projectRoot }: NodeOptions = {},
): Options {
  const config: Options = {
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    testMatch: ["**/*.test.ts"],
    testPathIgnorePatterns: ["lib/", "lib-es/", "node_modules/"],
    transform: swcTransform,
    coverageDirectory: "./coverage/",
    coverageReporters: lcovCoverageReporters(projectRoot ?? lcovRoot(overrides.rootDir, "../../")),
    reporters: freshReporters([
      "default",
      ...(process.env.CI ? ["github-actions"] : []),
      ...sharedReporters,
    ]),
    setupFilesAfterEnv: [quarantineRetries],
    ...overrides,
  };
  return esm ? withEsmDeps(config, { extraDeps: extraEsmDeps }) : config;
}

// The options sharedNodeConfig() reads, and the node factories built on it.
export const NODE_OPTIONS: readonly (keyof NodeOptions)[] = deepFreeze([
  "esm",
  "extraEsmDeps",
  "projectRoot",
]);
