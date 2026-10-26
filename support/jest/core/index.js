// Private core of the presets, not exported: the pieces every preset shares, and the dual web and
// native projects that `shared` and `features-flow` build on. A layer adds only its own mocks, test
// matching, resolver and transform allowlist.
const path = require("path");

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
const platformExtensions = platform => [
  `${platform}.tsx`,
  `${platform}.ts`,
  "tsx",
  "ts",
  "js",
  "jsx",
  "json",
];

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

/** @param {ReturnType<typeof lcovCoverageReporters>} coverageReporters */
function webProject(coverageReporters) {
  return {
    testPathIgnorePatterns: ["lib/", "lib-es/", "node_modules/"],
    transform: swcTransform,
    coverageReporters,
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

/** @param {ReturnType<typeof lcovCoverageReporters>} coverageReporters */
function nativeProject(coverageReporters) {
  return {
    testPathIgnorePatterns: ["lib/", "lib-es/", "node_modules/"],
    transform: swcTransform,
    coverageReporters,
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
  const coverageReporters = lcovCoverageReporters(lcovRoot(overrides.rootDir, depth));

  return {
    collectCoverage: true,
    coverageDirectory: "./coverage/",
    reporters: [
      "default",
      ...(process.env.CI ? ["github-actions"] : []),
      jestSonarReporter,
      quarantineReporter,
    ],
    projects: [
      ...(web ? [layerProject(webProject(coverageReporters), web, webOverrides)] : []),
      layerProject(nativeProject(coverageReporters), native, nativeOverrides),
    ],
    ...overrides,
  };
}

module.exports = {
  createDualJestConfig,
  jestSonarReporter,
  lcovCoverageReporters,
  lcovRoot,
  nativeMocks,
  platformExtensions,
  quarantineReporter,
  quarantineRetries,
  swcTransform,
};
