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

const coverageReporters = ["json", ["lcov", { file: "lcov.info", projectRoot: "../../" }], "text"];

/**
 * Tail reporters shared by every config. Exported so callers that need to insert an extra
 * reporter (e.g. github-actions) can spread this after their insertion:
 *
 *   reporters: ["default", ...(CI ? ["github-actions"] : []), ...sharedReporters]
 */
const sharedReporters = [jestSonarReporter, "@ledgerhq/test-quarantine/jest"];

const reporters = ["default", ...sharedReporters];

// ─── shared/* (logic packages) ──────────────────────────────────────────────

/**
 * Flat jest config for a shared/* logic package running in node.
 *
 * @param {import('@jest/types').Config.InitialOptions} [overrides]
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createSharedJestConfig(overrides = {}) {
  return {
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    testMatch: ["**/*.test.ts"],
    testPathIgnorePatterns: ["lib/", "lib-es/", "node_modules/"],
    transform: swcTransform,
    coverageDirectory: "./coverage/",
    coverageReporters,
    reporters,
    setupFilesAfterEnv: ["@ledgerhq/test-quarantine/jest-retries"],
    ...overrides,
  };
}

// ─── shared/ui-* (UI packages) ──────────────────────────────────────────────

const webMocks = {
  "^@ledgerhq/lumen-ui-react(/.*)?$": path.join(__dirname, "mocks/passthrough-web.js"),
  "^@ledgerhq/crypto-icons$": path.join(__dirname, "mocks/passthrough-web.js"),
  "\\.(webp|png|jpg|jpeg|gif|svg)$": path.join(__dirname, "mocks/file-stub.js"),
};

const nativeMocks = {
  "^react-native$": path.join(__dirname, "mocks/react-native.js"),
  "^react-native-safe-area-context$": path.join(__dirname, "mocks/safe-area-context.js"),
  "^@ledgerhq/lumen-ui-rnative(/.*)?$": path.join(__dirname, "mocks/passthrough-native.js"),
  "^@ledgerhq/crypto-icons$": path.join(__dirname, "mocks/passthrough-native.js"),
  "\\.(webp|png|jpg|jpeg|gif|svg)$": path.join(__dirname, "mocks/file-stub.js"),
};

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
 * Dual-project jest config for a shared/ui-* package with web and native tests.
 *
 * - web project: jsdom, matches *.web.test.ts(x) — Desktop.
 * - native project: node, matches *.native.test.ts(x) — Mobile.
 *
 * Per-project overrides via `webOverrides` / `nativeOverrides`.
 * Providing `moduleNameMapper` inside an override replaces the default mocks for that project.
 *
 * @param {{ webOverrides?: object, nativeOverrides?: object } & import('@jest/types').Config.InitialOptions} [options]
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createSharedUiJestConfig({
  webOverrides = {},
  nativeOverrides = {},
  ...topOverrides
} = {}) {
  const base = {
    testPathIgnorePatterns: ["lib/", "lib-es/", "node_modules/"],
    transform: swcTransform,
    coverageReporters,
  };

  return {
    collectCoverage: true,
    coverageDirectory: "./coverage/",
    reporters,
    projects: [
      {
        ...base,
        displayName: "web",
        testEnvironment: "jsdom",
        moduleFileExtensions: platformExtensions("web"),
        testMatch: ["**/*.web.test.ts?(x)", "**/*.web.spec.ts?(x)"],
        moduleNameMapper: { ...webMocks },
        setupFilesAfterEnv: [
          "@testing-library/jest-dom",
          path.join(__dirname, "setup/web.js"),
          "@ledgerhq/test-quarantine/jest-retries",
        ],
        ...webOverrides,
      },
      {
        ...base,
        displayName: "native",
        testEnvironment: "node",
        moduleFileExtensions: platformExtensions("native"),
        testMatch: ["**/*.native.test.ts?(x)", "**/*.native.spec.ts?(x)"],
        moduleNameMapper: { ...nativeMocks },
        setupFilesAfterEnv: ["@ledgerhq/test-quarantine/jest-retries"],
        ...nativeOverrides,
      },
    ],
    ...topOverrides,
  };
}

/**
 * Jest config for a shared/ui-* package with native-only tests (*.native.test.ts).
 *
 * Provides react-native, safe-area-context, Lumen native, and image stubs by default.
 * Pass extra `moduleNameMapper` entries to add package-specific mocks alongside the base ones.
 * Requires no web-only dependencies (jest-environment-jsdom, @testing-library/jest-dom).
 *
 * @param {{ moduleNameMapper?: object } & import('@jest/types').Config.InitialOptions} [overrides]
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createSharedUiNativeJestConfig({ moduleNameMapper: extraMocks = {}, ...overrides } = {}) {
  return createSharedJestConfig({
    collectCoverage: true,
    testMatch: ["**/*.native.test.ts?(x)", "**/*.native.spec.ts?(x)"],
    moduleFileExtensions: platformExtensions("native"),
    moduleNameMapper: { ...nativeMocks, ...extraMocks },
    ...overrides,
  });
}

module.exports = {
  createSharedJestConfig,
  createSharedUiJestConfig,
  createSharedUiNativeJestConfig,
  jestSonarReporter,
  sharedReporters,
};
