// Private core of the presets, not exported: the pieces every preset shares, and the dual web and
// native projects that `shared` and `features-flow` build on. A layer adds only its own mocks, test
// matching, resolver and transform allowlist.
import type { Config } from "@jest/types";
import path from "node:path";
import { deepFreeze } from "../internals/freeze.mts";
import { joinPresetPath } from "../internals/join-preset-path.mts";
import PRESET_OVERRIDES from "./preset-overrides.js";

type Options = Config.InitialOptions;
type ProjectOptions = Config.InitialProjectOptions;
type Reporters = NonNullable<Options["reporters"]>;

/** The overrides a dual preset takes: top-level keys, and the keys of each project. */
export type DualOverrides = Options & {
  webOverrides?: ProjectOptions;
  nativeOverrides?: ProjectOptions;
};

export const swcTransform: Record<string, Config.TransformerConfig> = {
  "^.+\\.(t|j)sx?$": [
    "@swc/jest",
    { jsc: { target: "esnext", parser: { syntax: "typescript", tsx: true } } },
  ],
};

export const jestSonarReporter: Config.ReporterConfig = deepFreeze([
  "jest-sonar",
  { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" },
]);

// Bare strings, so jest resolves them from the consumer, which declares the dependency.
export const quarantineReporter = "@ledgerhq/test-quarantine/jest";
export const quarantineRetries = "@ledgerhq/test-quarantine/jest-retries";

/**
 * Unfrozen copies of reporter entries, for a config's `reporters`: jest's normalization writes the
 * resolved module path into each reporter tuple it gets.
 */
export function freshReporters(reporters: Reporters): Reporters {
  return structuredClone(reporters);
}

const repositoryRoot = path.resolve(import.meta.dirname, "../../..");

export function lcovCoverageReporters(projectRoot: string): Config.CoverageReporters {
  return ["json", ["lcov", { file: "lcov.info", projectRoot }], "text"];
}

/**
 * The lcov `projectRoot`: the repository root seen from `rootDir` when set, else `depth`, the
 * relative path from a package of the layer to the repository root.
 */
export function lcovRoot(rootDir: string | undefined, depth: string): string {
  return rootDir === undefined ? depth : `${path.relative(rootDir, repositoryRoot)}/`;
}

const corePath = (file: string) => joinPresetPath(import.meta.dirname, file);

// The core projects' mocks and setup files, which a layer or a package spreads to keep them (the
// override rule of the `@support/jest` README).

// Redirect the heavy Lumen/crypto-icons ESM barrels to a generic passthrough stub so tests
// don't need to transform them or install their peer graph. See mocks/*.js.
export const webMocks: Record<string, string> = deepFreeze({
  "^@ledgerhq/lumen-ui-react(/.*)?$": corePath("mocks/passthrough-web.js"),
  "^@ledgerhq/crypto-icons$": corePath("mocks/passthrough-web.js"),
  "\\.(webp|png|jpg|jpeg|gif|svg)$": corePath("mocks/file-stub.js"),
});

export const nativeMocks: Record<string, string> = deepFreeze({
  // Stub react-native itself (Flow-typed ESM) so native tests run in a plain node env.
  // Mapped here (not jest.mock in a setup file) so it also intercepts react-native imports
  // from inside @testing-library/react-native.
  "^react-native$": corePath("mocks/react-native.js"),
  "^react-native-safe-area-context$": corePath("mocks/safe-area-context.js"),
  "^@ledgerhq/lumen-ui-rnative(/.*)?$": corePath("mocks/passthrough-native.js"),
  "^@ledgerhq/crypto-icons$": corePath("mocks/passthrough-native.js"),
  "\\.(webp|png|jpg|jpeg|gif|svg)$": corePath("mocks/file-stub.js"),
});

export const webSetupFiles: string[] = deepFreeze([
  "@testing-library/jest-dom",
  corePath("setup/web.js"),
  quarantineRetries,
]);

export const nativeSetupFiles: string[] = deepFreeze([quarantineRetries]);

// Platform variants resolve like they do in the bundlers (Rspack `resolve.extensions`, Metro
// platform extensions), so a `.web`/`.native` suffix stays confined to the file that needs one.
export function platformExtensions(platform: "web" | "native"): string[] {
  return [`${platform}.tsx`, `${platform}.ts`, "tsx", "ts", "js", "jsx", "json"];
}

/**
 * Applies a project override: every key replaces the project's value, as in jest. The mocks and
 * setup files the result keeps go to jest as unfrozen copies, like `freshReporters`.
 */
export function withProjectOverrides(
  project: ProjectOptions,
  overrides: ProjectOptions,
): ProjectOptions {
  const { moduleNameMapper, setupFilesAfterEnv } = { ...project, ...overrides };
  return {
    ...project,
    ...overrides,
    ...(moduleNameMapper && { moduleNameMapper: { ...moduleNameMapper } }),
    ...(setupFilesAfterEnv && { setupFilesAfterEnv: [...setupFilesAfterEnv] }),
  };
}

function webProject(): ProjectOptions {
  return {
    testPathIgnorePatterns: ["lib/", "lib-es/", "node_modules/"],
    transform: swcTransform,
    displayName: "web",
    testEnvironment: "jsdom",
    moduleFileExtensions: platformExtensions("web"),
    // Unsuffixed tests run on the web side only.
    testMatch: [
      "**/*.web.test.ts?(x)",
      "**/*.web.spec.ts?(x)",
      "**/!(*.web|*.native).test.ts?(x)",
      "**/!(*.web|*.native).spec.ts?(x)",
    ],
    moduleNameMapper: webMocks,
    setupFilesAfterEnv: webSetupFiles,
  };
}

function nativeProject(): ProjectOptions {
  return {
    testPathIgnorePatterns: ["lib/", "lib-es/", "node_modules/"],
    transform: swcTransform,
    displayName: "native",
    testEnvironment: "node",
    moduleFileExtensions: platformExtensions("native"),
    testMatch: ["**/*.native.test.ts?(x)", "**/*.native.spec.ts?(x)"],
    moduleNameMapper: nativeMocks,
    setupFilesAfterEnv: nativeSetupFiles,
  };
}

/**
 * A core project with the layer's keys, then the consumer's overrides, by the override rule of the
 * `@support/jest` README (`withProjectOverrides`).
 */
function layerProject(
  project: ProjectOptions,
  layer: ProjectOptions,
  overrides: ProjectOptions,
): ProjectOptions {
  return withProjectOverrides(withProjectOverrides(project, layer), overrides);
}

export type DualLayer = {
  /** lcov root of a package of the layer, without `rootDir` */
  depth: string;
  /** the layer's keys of the web project; without it the config has the native project only */
  web?: ProjectOptions;
  /** the layer's keys of the native project, by the override rule */
  native: ProjectOptions;
};

// Keys a preset sets for every package of its layer, with what a package uses instead.
export const ESM_FIX = "keep a dependency transformed with the extraEsmDeps option";
export const PRESET_KEYS: Readonly<Record<string, string>> = deepFreeze({
  transform: ESM_FIX,
  transformIgnorePatterns: ESM_FIX,
  testEnvironment: "pick the preset of the environment the tests need",
  globals: "set the global in a setup file",
  reporters: "every preset reports the same way",
  coverageReporters: "every preset reports coverage the same way",
});
// A factory without the extraEsmDeps option keeps its layer's ESM dependencies in its allowlist.
export const ALLOWLIST_FIX =
  "add the dependency to the preset's transform allowlist in support/jest";
const TRANSFORM_KEYS = new Set(["transform", "transformIgnorePatterns"]);
const OVERRIDES_FILE = "support/jest/core/preset-overrides.js";

/**
 * Throws when a package overrides a key its preset owns and `preset-overrides.js` does not list
 * that key for the package and the factory, and when it lists a key no override sets, so the
 * list only shrinks. The package is found from `rootDir`.
 *
 * @param factory the factory the config calls
 * @param overrides the overrides objects, by label
 * @param options the options the factory reads, which pick the fix a message names
 */
function checkPresetOverrides(
  factory: string,
  overrides: Record<string, object | undefined>,
  rootDir: string | undefined,
  options: readonly string[] = [],
): void {
  const pkg =
    rootDir === undefined
      ? undefined
      : path.relative(repositoryRoot, rootDir).split(path.sep).join("/");
  const allowed = (pkg && PRESET_OVERRIDES[pkg]?.overrides[factory]) ?? [];
  const set = new Set<string>();
  for (const [label, object] of Object.entries(overrides)) {
    for (const key of Object.keys(object ?? {})) {
      if (!Object.hasOwn(PRESET_KEYS, key)) continue;
      set.add(key);
      if (!allowed.includes(key)) {
        const fix =
          TRANSFORM_KEYS.has(key) && !options.includes("extraEsmDeps")
            ? ALLOWLIST_FIX
            : PRESET_KEYS[key];
        throw new Error(
          `${factory}(): ${label}${key} belongs to the preset: ${fix}. A package that ` +
            `must still override it is listed, with its reason, in ${OVERRIDES_FILE} (found from rootDir).`,
        );
      }
    }
  }
  for (const key of allowed) {
    if (!set.has(key)) {
      throw new Error(
        `${factory}(): ${OVERRIDES_FILE} lists ${key} for ${pkg}, which no override sets; remove it.`,
      );
    }
  }
}

/**
 * Throws on an option the factory does not read, naming the ones it does.
 *
 * @param options the factory's options argument
 */
function checkOptions(
  factory: string,
  options: object | undefined,
  accepted: readonly string[],
): void {
  for (const key of Object.keys(options ?? {})) {
    if (!accepted.includes(key)) {
      const reads = accepted.length ? accepted.map(name => `\`${name}\``).join(", ") : "none";
      throw new Error(`${factory}(): it does not read the option "${key}"; its options: ${reads}.`);
    }
  }
}

// Any factory's signature: presetFactory() returns its builder's own.
// oxlint-disable-next-line typescript/no-explicit-any
type Builder = (overrides?: any, options?: any) => any;

type PresetFactoryEntry = { factory: Builder; options: readonly string[]; project: boolean };

const PRESET_FACTORIES = new Map<string, PresetFactoryEntry>();
// The projects a project factory returned: the only entries a config's `projects` may hold.
const PRESET_PROJECTS = new WeakSet<object>();
// The factories of `projects` entries, by the module that exports each. Listed here, not taken from
// the registry, which holds only the presets loaded so far.
export const PROJECT_FACTORIES: Readonly<Record<string, string>> = deepFreeze({
  createLibsCoinJestProject: "@support/jest/libs-coin",
});

/**
 * Throws when `projects` holds an entry no preset project factory returned. Why a project needs one:
 * `createLibsCoinJestProject` in support/jest/README.md.
 */
function checkProjects(factory: string, projects: unknown): void {
  if (projects === undefined) return;
  const builders = Object.entries(PROJECT_FACTORIES)
    .map(([name, specifier]) => `${name}() from ${specifier}`)
    .join(", ");
  const entries: unknown[] = Array.isArray(projects) ? projects : [projects];
  entries.forEach((entry, index) => {
    if (typeof entry !== "object" || entry === null || !PRESET_PROJECTS.has(entry)) {
      throw new Error(
        `${factory}(): projects[${index}] is not built by a preset project factory: use ${builders}.`,
      );
    }
  });
}

/**
 * An exported preset factory: it checks the options and the overrides it gets, then returns what
 * `build` makes of them. Every preset factory is built here, so none can skip the checks.
 *
 * @param name the factory name, for the messages and preset-overrides.js
 * @param options the options the factory reads
 * @returns a factory with the signature of `build`; a factory of `projects` entries when
 *   `PROJECT_FACTORIES` lists the name
 */
export function presetFactory<Build extends Builder>(
  name: string,
  options: readonly string[],
  build: Build,
): Build {
  const project = Object.hasOwn(PROJECT_FACTORIES, name);
  /** @param presetOptions the options `build` reads */
  function checkedFactory(
    overrides: DualOverrides = {},
    presetOptions?: Record<string, unknown>,
  ): ReturnType<Build> {
    checkOptions(name, presetOptions, options);
    const { webOverrides, nativeOverrides, ...topLevel } = overrides;
    checkPresetOverrides(
      name,
      { "": topLevel, "webOverrides.": webOverrides, "nativeOverrides.": nativeOverrides },
      overrides.rootDir,
      options,
    );
    checkProjects(name, overrides.projects);
    const config = build(overrides, presetOptions);
    if (project) PRESET_PROJECTS.add(config);
    return config;
  }
  // The checks take any factory's arguments; the export keeps the signature of its builder.
  const factory = checkedFactory as unknown as Build;
  PRESET_FACTORIES.set(name, { factory, options: deepFreeze([...options]), project });
  return factory;
}

/**
 * The factories presetFactory() built so far, with the options each reads: the presets register
 * theirs when they load.
 */
export function presetFactories(): ({ name: string } & PresetFactoryEntry)[] {
  return [...PRESET_FACTORIES].map(([name, entry]) => ({ name, ...entry }));
}

/**
 * Projects config of a dual web/native preset: jsdom web project (*.web.test.ts(x) and unsuffixed
 * tests), node native project (*.native.test.ts(x)), test quarantine, sonar and, on CI, the
 * github-actions reporter.
 *
 * `webOverrides` / `nativeOverrides` apply to each project after the layer's keys (see
 * `layerProject`). Any other option is a top-level key and replaces the preset's.
 */
export function createDualJestConfig(
  { depth, web, native }: DualLayer,
  { webOverrides = {}, nativeOverrides = {}, ...overrides }: DualOverrides = {},
): Options {
  return {
    collectCoverage: true,
    coverageDirectory: "./coverage/",
    // Top level: jest ignores coverageReporters inside a project.
    coverageReporters: lcovCoverageReporters(lcovRoot(overrides.rootDir, depth)),
    reporters: freshReporters([
      "default",
      ...(process.env.CI ? ["github-actions"] : []),
      jestSonarReporter,
      quarantineReporter,
    ]),
    projects: [
      ...(web ? [layerProject(webProject(), web, webOverrides)] : []),
      layerProject(nativeProject(), native, nativeOverrides),
    ],
    ...overrides,
  };
}
