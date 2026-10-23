const path = require("path");

const swcTransform = {
  "^.+\\.(t|j)sx?$": [
    "@swc/jest",
    { jsc: { target: "esnext", parser: { syntax: "typescript", tsx: true } } },
  ],
};

// Redirect the heavy Lumen/crypto-icons ESM barrels to a generic passthrough stub so tests
// don't need to transform them or install their peer graph. See mocks/*.js.
const webMocks = {
  "^@ledgerhq/lumen-ui-react(/.*)?$": path.join(__dirname, "mocks/passthrough-web.js"),
  "^@ledgerhq/crypto-icons$": path.join(__dirname, "mocks/passthrough-web.js"),
  "\\.(webp|png|jpg|jpeg|gif|svg)$": path.join(__dirname, "mocks/file-stub.js"),
};

// Lumen's shared utils (`cn`, the amount formatters) and its design tokens ship as ESM and are
// real values the views pass around, so SWC has to compile them instead of a stub standing in —
// unlike the component barrels above, which only need to render a DOM node. Entries match the
// pnpm store directory names.
const transformAllowlist = ["@ledgerhq\\+lumen-utils-shared", "@ledgerhq\\+lumen-design-core"];

const nativeMocks = {
  // Stub react-native itself (Flow-typed ESM) so native tests run in a plain node env.
  // Mapped here (not jest.mock in a setup file) so it also intercepts react-native imports
  // from inside @testing-library/react-native.
  "^react-native$": path.join(__dirname, "mocks/react-native.js"),
  "^react-native-reanimated$": path.join(__dirname, "mocks/reanimated.js"),
  "^react-native-draggable-flatlist$": path.join(__dirname, "mocks/draggable-flatlist.js"),
  "^react-native-svg(/.*)?$": path.join(__dirname, "mocks/react-native-svg.js"),
  "^react-native-safe-area-context$": path.join(__dirname, "mocks/safe-area-context.js"),
  "^react-native-fast-crypto$": path.join(__dirname, "mocks/fast-crypto.js"),
  "^expo-clipboard$": path.join(__dirname, "mocks/expo-clipboard.js"),
  "^@react-navigation/native$": path.join(__dirname, "mocks/react-navigation-native.js"),
  "^@ledgerhq/lumen-ui-rnative(/.*)?$": path.join(__dirname, "mocks/passthrough-native.js"),
  "^@ledgerhq/crypto-icons$": path.join(__dirname, "mocks/passthrough-native.js"),
  "\\.(webp|png|jpg|jpeg|gif|svg)$": path.join(__dirname, "mocks/file-stub.js"),
  "^@shared/ui-queued-bottom-sheet$": "@shared/ui-queued-bottom-sheet/testing/module-mock",
  "^@shared/ui-queued-bottom-sheet/keyboard$": "@shared/ui-queued-bottom-sheet/testing/module-mock",
};

// Platform variants resolve like they do in the bundlers (Rspack `resolve.extensions`, Metro
// platform extensions), so a `.web`/`.native` suffix stays confined to the file that needs one:
// `import { FeatureTourView } from "./FeatureTourView"` picks the right side per project.
const platformExtensions = platform => [
  `${platform}.tsx`,
  `${platform}.ts`,
  "tsx",
  "ts",
  "js",
  "jsx",
  "json",
];

function baseProject() {
  return {
    testPathIgnorePatterns: ["lib/", "lib-es/", "node_modules/"],
    transform: swcTransform,
    transformIgnorePatterns: [`node_modules/.pnpm/(?!(${transformAllowlist.join("|")}))`],
    coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../../" }], "text"],
  };
}

function webProject() {
  return {
    ...baseProject(),
    displayName: "web",
    testEnvironment: "jsdom",
    moduleFileExtensions: platformExtensions("web"),
    testMatch: [
      "**/*.web.test.ts?(x)",
      "**/*.web.spec.ts?(x)",
      "**/!(*.web|*.native).test.ts?(x)",
      "**/!(*.web|*.native).spec.ts?(x)",
    ],
    moduleNameMapper: { ...webMocks },
    setupFilesAfterEnv: ["@testing-library/jest-dom", path.join(__dirname, "setup/web.js")],
  };
}

function nativeProject() {
  return {
    ...baseProject(),
    displayName: "native",
    testEnvironment: "node",
    resolver: path.join(__dirname, "resolver.native.js"),
    moduleFileExtensions: platformExtensions("native"),
    testMatch: ["**/*.native.test.ts?(x)", "**/*.native.spec.ts?(x)"],
    moduleNameMapper: { ...nativeMocks },
  };
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

/**
 * @param {import('@jest/types').Config.InitialProjectOptions[]} projects
 * @param {import('@jest/types').Config.InitialOptions} overrides
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function flowConfig(projects, overrides) {
  return {
    collectCoverage: true,
    coverageDirectory: "./coverage/",
    reporters: [
      "default",
      [
        "jest-sonar",
        { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" },
      ],
    ],
    projects,
    ...overrides,
  };
}

/**
 * Dual-project jest config for a features/flow package.
 *
 * - web project: jsdom, matches *.web.test.ts(x), for Desktop.
 * - native project: node, matches *.native.test.ts(x), for Mobile.
 *
 * Per-project overrides via `webOverrides` / `nativeOverrides`: `setupFilesAfterEnv` and
 * `moduleNameMapper` add to the project's defaults, any other key replaces them.
 *
 * @param {{ webOverrides?: object, nativeOverrides?: object } & import('@jest/types').Config.InitialOptions} [options]
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createFlowJestConfig({ webOverrides = {}, nativeOverrides = {}, ...overrides } = {}) {
  return flowConfig(
    [
      withProjectOverrides(webProject(), webOverrides),
      withProjectOverrides(nativeProject(), nativeOverrides),
    ],
    overrides,
  );
}

/**
 * Jest config for a features/flow package with native-only tests: the native project of
 * createFlowJestConfig(), without the web one. Requires no web-only dependencies
 * (jest-environment-jsdom, @testing-library/jest-dom).
 *
 * @param {{ nativeOverrides?: object } & import('@jest/types').Config.InitialOptions} [options]
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createFlowNativeJestConfig({ nativeOverrides = {}, ...overrides } = {}) {
  return flowConfig([withProjectOverrides(nativeProject(), nativeOverrides)], overrides);
}

module.exports = { createFlowJestConfig, createFlowNativeJestConfig };
