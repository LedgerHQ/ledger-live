// Private core of the presets, not exported: the pieces every preset shares, and the dual web and
// native projects that `shared` and `features-flow` build on. A layer adds only its own mocks, test
// matching, resolver and transform allowlist.
const path = require("path");
const { deepFreeze } = require("../internals/freeze");
const PRESET_OVERRIDES = require("./preset-overrides");

const swcTransform = {
  "^.+\\.(t|j)sx?$": [
    "@swc/jest",
    { jsc: { target: "esnext", parser: { syntax: "typescript", tsx: true } } },
  ],
};

const jestSonarReporter = [
  "jest-sonar",
  { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" },
];

// Bare strings, so jest resolves them from the consumer, which declares the dependency.
const quarantineReporter = "@ledgerhq/test-quarantine/jest";
const quarantineRetries = "@ledgerhq/test-quarantine/jest-retries";

const repositoryRoot = path.resolve(__dirname, "../../..");

/** @param {string} projectRoot */
const lcovCoverageReporters = projectRoot => [
  "json",
  ["lcov", { file: "lcov.info", projectRoot }],
  "text",
];

/**
 * The lcov `projectRoot`: the repository root seen from `rootDir` when set, else `depth`, the
 * relative path from a package of the layer to the repository root.
 *
 * @param {string | undefined} rootDir
 * @param {string} depth
 * @returns {string}
 */
function lcovRoot(rootDir, depth) {
  return rootDir === undefined ? depth : `${path.relative(rootDir, repositoryRoot)}/`;
}

// Redirect the heavy Lumen/crypto-icons ESM barrels to a generic passthrough stub so tests
// don't need to transform them or install their peer graph. See mocks/*.js.
const webMocks = {
  "^@ledgerhq/lumen-ui-react(/.*)?$": path.join(__dirname, "mocks/passthrough-web.js"),
  "^@ledgerhq/crypto-icons$": path.join(__dirname, "mocks/passthrough-web.js"),
  "\\.(webp|png|jpg|jpeg|gif|svg)$": path.join(__dirname, "mocks/file-stub.js"),
};

const nativeMocks = {
  // Stub react-native itself (Flow-typed ESM) so native tests run in a plain node env.
  // Mapped here (not jest.mock in a setup file) so it also intercepts react-native imports
  // from inside @testing-library/react-native.
  "^react-native$": path.join(__dirname, "mocks/react-native.js"),
  "^react-native-safe-area-context$": path.join(__dirname, "mocks/safe-area-context.js"),
  "^@ledgerhq/lumen-ui-rnative(/.*)?$": path.join(__dirname, "mocks/passthrough-native.js"),
  "^@ledgerhq/crypto-icons$": path.join(__dirname, "mocks/passthrough-native.js"),
  "\\.(webp|png|jpg|jpeg|gif|svg)$": path.join(__dirname, "mocks/file-stub.js"),
};

// Platform variants resolve like they do in the bundlers (Rspack `resolve.extensions`, Metro
// platform extensions), so a `.web`/`.native` suffix stays confined to the file that needs one.
/**
 * @param {"web" | "native"} platform
 * @returns {string[]}
 */
function platformExtensions(platform) {
  return [`${platform}.tsx`, `${platform}.ts`, "tsx", "ts", "js", "jsx", "json"];
}

/**
 * Applies a project override: `setupFilesAfterEnv` and `moduleNameMapper` add to the project's
 * own, every other key replaces the project's value.
 *
 * @param {import('@jest/types').Config.InitialProjectOptions} project
 * @param {import('@jest/types').Config.InitialProjectOptions} overrides
 * @returns {import('@jest/types').Config.InitialProjectOptions}
 */
function withProjectOverrides(project, { setupFilesAfterEnv, moduleNameMapper, ...overrides }) {
  return {
    ...project,
    ...overrides,
    ...(setupFilesAfterEnv && {
      setupFilesAfterEnv: [...(project.setupFilesAfterEnv ?? []), ...setupFilesAfterEnv],
    }),
    ...(moduleNameMapper && {
      moduleNameMapper: { ...project.moduleNameMapper, ...moduleNameMapper },
    }),
  };
}

function webProject() {
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
    moduleNameMapper: { ...webMocks },
    setupFilesAfterEnv: [
      "@testing-library/jest-dom",
      path.join(__dirname, "setup/web.js"),
      quarantineRetries,
    ],
  };
}

function nativeProject() {
  return {
    testPathIgnorePatterns: ["lib/", "lib-es/", "node_modules/"],
    transform: swcTransform,
    displayName: "native",
    testEnvironment: "node",
    moduleFileExtensions: platformExtensions("native"),
    testMatch: ["**/*.native.test.ts?(x)", "**/*.native.spec.ts?(x)"],
    moduleNameMapper: { ...nativeMocks },
    setupFilesAfterEnv: [quarantineRetries],
  };
}

/**
 * A core project with the layer's additions, then the consumer's overrides, both by the
 * `withProjectOverrides` rule.
 *
 * @param {import('@jest/types').Config.InitialProjectOptions} project
 * @param {import('@jest/types').Config.InitialProjectOptions} layer
 * @param {import('@jest/types').Config.InitialProjectOptions} overrides
 * @returns {import('@jest/types').Config.InitialProjectOptions}
 */
function layerProject(project, layer, overrides) {
  return withProjectOverrides(withProjectOverrides(project, layer), overrides);
}

/**
 * @typedef {object} DualLayer
 * @property {string} depth lcov root of a package of the layer, without `rootDir`
 * @property {import('@jest/types').Config.InitialProjectOptions} [web] what the layer adds to the
 *   web project, by the override rule; without it the config has the native project only
 * @property {import('@jest/types').Config.InitialProjectOptions} native what the layer adds to the
 *   native project, by the override rule
 */

// Keys a preset sets for every package of its layer, with what a package uses instead.
const ESM_FIX = "keep a dependency transformed with the extraEsmDeps option";
const PRESET_KEYS = deepFreeze({
  transform: ESM_FIX,
  transformIgnorePatterns: ESM_FIX,
  testEnvironment: "pick the preset of the environment the tests need",
  globals: "set the global in a setup file",
  reporters: "every preset reports the same way",
  coverageReporters: "every preset reports coverage the same way",
});
// A factory without the extraEsmDeps option keeps its layer's ESM dependencies in its allowlist.
const ALLOWLIST_FIX = "add the dependency to the preset's transform allowlist in support/jest";
const TRANSFORM_KEYS = new Set(["transform", "transformIgnorePatterns"]);
const OVERRIDES_FILE = "support/jest/core/preset-overrides.js";

/**
 * Throws when a package overrides a key its preset owns and `preset-overrides.js` does not list
 * that key for the package and the factory, and when it lists a key no override sets, so the
 * list only shrinks. The package is found from `rootDir`.
 *
 * @param {string} factory the factory the config calls
 * @param {Record<string, object | undefined>} overrides the overrides objects, by label
 * @param {string | undefined} rootDir
 * @param {string[]} [options] the options the factory reads, which pick the fix a message names
 */
function checkPresetOverrides(factory, overrides, rootDir, options = []) {
  const pkg =
    rootDir === undefined
      ? undefined
      : path.relative(repositoryRoot, rootDir).split(path.sep).join("/");
  const allowed = (pkg && PRESET_OVERRIDES[pkg]?.overrides[factory]) ?? [];
  const set = new Set();
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
 * @param {string} factory
 * @param {object | undefined} options the factory's options argument
 * @param {string[]} accepted
 */
function checkOptions(factory, options, accepted) {
  for (const key of Object.keys(options ?? {})) {
    if (!accepted.includes(key)) {
      const reads = accepted.length ? accepted.map(name => `\`${name}\``).join(", ") : "none";
      throw new Error(`${factory}(): it does not read the option "${key}"; its options: ${reads}.`);
    }
  }
}

/** @type {Map<string, { factory: Function, options: readonly string[], project: boolean }>} */
const PRESET_FACTORIES = new Map();
// The projects a project factory returned: the only entries a config's `projects` may hold.
const PRESET_PROJECTS = new WeakSet();

/**
 * Throws when `projects` holds an entry no preset project factory returned: jest does not pass a
 * config's top-level options down to its projects, so a hand-written one skips the preset.
 *
 * @param {string} factory
 * @param {unknown} projects
 */
function checkProjects(factory, projects) {
  if (projects === undefined) return;
  const builders = [...PRESET_FACTORIES]
    .filter(([, entry]) => entry.project)
    .map(([name]) => `${name}()`)
    .join(", ");
  const entries = Array.isArray(projects) ? projects : [projects];
  entries.forEach((entry, index) => {
    if (!PRESET_PROJECTS.has(entry)) {
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
 * @template {(overrides?: any, options?: any) => any} Build
 * @param {string} name the factory name, for the messages and preset-overrides.js
 * @param {string[]} options the options the factory reads
 * @param {Build} build
 * @param {{ project?: boolean }} [kind] `project: true` for a factory of `projects` entries
 * @returns {Build} a factory with the signature of `build`
 */
function presetFactory(name, options, build, { project = false } = {}) {
  const factory = /** @type {Build} */ (
    (overrides = {}, presetOptions) => {
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
  );
  PRESET_FACTORIES.set(name, { factory, options: deepFreeze([...options]), project });
  return factory;
}

/**
 * The factories presetFactory() built so far, with the options each reads: the presets register
 * theirs when they load.
 *
 * @returns {{ name: string, factory: Function, options: readonly string[], project: boolean }[]}
 */
function presetFactories() {
  return [...PRESET_FACTORIES].map(([name, entry]) => ({ name, ...entry }));
}

/**
 * Projects config of a dual web/native preset: jsdom web project (*.web.test.ts(x) and unsuffixed
 * tests), node native project (*.native.test.ts(x)), test quarantine, sonar and, on CI, the
 * github-actions reporter.
 *
 * `webOverrides` / `nativeOverrides` apply to each project after the layer's additions (see
 * `layerProject`). Any other option is a top-level key and replaces the preset's.
 *
 * @param {DualLayer} layer
 * @param {{ webOverrides?: object, nativeOverrides?: object } & import('@jest/types').Config.InitialOptions} [options]
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createDualJestConfig(
  { depth, web, native },
  { webOverrides = {}, nativeOverrides = {}, ...overrides } = {},
) {
  return {
    collectCoverage: true,
    coverageDirectory: "./coverage/",
    // Top level: jest ignores coverageReporters inside a project.
    coverageReporters: lcovCoverageReporters(lcovRoot(overrides.rootDir, depth)),
    reporters: [
      "default",
      ...(process.env.CI ? ["github-actions"] : []),
      jestSonarReporter,
      quarantineReporter,
    ],
    projects: [
      ...(web ? [layerProject(webProject(), web, webOverrides)] : []),
      layerProject(nativeProject(), native, nativeOverrides),
    ],
    ...overrides,
  };
}

module.exports = {
  ALLOWLIST_FIX,
  ESM_FIX,
  PRESET_KEYS,
  createDualJestConfig,
  jestSonarReporter,
  lcovCoverageReporters,
  lcovRoot,
  nativeMocks,
  platformExtensions,
  presetFactories,
  presetFactory,
  quarantineReporter,
  quarantineRetries,
  swcTransform,
  withProjectOverrides,
};
