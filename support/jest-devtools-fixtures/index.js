// Shared jest presets for devtools/* packages: a jsdom project for *.web.test.* and a
// react-native project for *.native.test.*.
//
// Paths pointing inside this package are absolute, because `<rootDir>` in a returned config is
// substituted against the *consumer's* root, not this one. Paths that must resolve in the consumer
// — its node_modules, its jest/ folder — deliberately keep `<rootDir>`.

const path = require("path");

const here = relative => path.join(__dirname, relative);

const swcJsc = { target: "esnext", transform: { react: { runtime: "automatic" } } };

const coverageReporters = file => ["json", ["lcov", { file, projectRoot: "../../" }], "text"];

const sonarReporter = outputName => ["jest-sonar", { outputName, reportedFilePath: "absolute" }];

// Union of what the three devtools packages each allowed through. Naming a package a given consumer
// does not depend on is harmless, and it removes three drifting copies of this list.
const NATIVE_TRANSFORM_ALLOWLIST = [
  ".pnpm",
  "(jest-)?react-native",
  "react-native-safe-area-context",
  "react-native-reanimated",
  "react-native-worklets",
  "react-native-screens",
  "@react-native(-community)?",
  "@react-navigation/.*",
  "@gorhom/bottom-sheet",
  "@ledgerhq/lumen-.*",
  "immer",
];

const WEB_TRANSFORM_ALLOWLIST = [
  "@ledgerhq\\+lumen-ui-react",
  "@ledgerhq\\+lumen-design-core",
  "@ledgerhq\\+lumen-utils-shared",
];

/**
 * jsdom project for a devtools package's `*.web.test.*` files.
 *
 * @param {import('@jest/types').Config.InitialOptions} [overrides] `moduleNameMapper` is merged
 * into the preset's; every other key replaces it.
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createWebJestConfig({ moduleNameMapper, ...overrides } = {}) {
  return {
    testEnvironment: "jsdom",
    roots: ["<rootDir>/src"],
    transform: { "^.+\\.(t|j)sx?$": ["@swc/jest", { jsc: swcJsc }] },
    moduleFileExtensions: ["web.tsx", "web.ts", "tsx", "ts", "js", "jsx", "json", "node"],
    testPathIgnorePatterns: ["\\.native\\.test\\."],
    // lets tests import the package's own `jest/…` helpers
    modulePaths: ["<rootDir>"],
    transformIgnorePatterns: [`node_modules/.pnpm/(?!(${WEB_TRANSFORM_ALLOWLIST.join("|")}))`],
    setupFilesAfterEnv: ["@testing-library/jest-dom", here("setup/web.js")],
    moduleNameMapper: {
      // Pin lumen to the consumer's copy. Two reasons: this package does not carry lumen's peer
      // graph (clsx, radix, …), and a second lumen instance would give the ThemeProvider rendered
      // here a different React context than the components under test.
      "^@ledgerhq/lumen-ui-react$": "<rootDir>/node_modules/@ledgerhq/lumen-ui-react",
      ...moduleNameMapper,
    },
    coverageReporters: coverageReporters("lcov.info"),
    reporters: ["default", sonarReporter("sonar-executionTests-report.xml")],
    ...overrides,
  };
}

/**
 * react-native project for a devtools package's `*.native.test.*` files.
 *
 * Requires a `babel.config.js` at the consumer's root: babel resolves its config from the jest
 * rootDir, and babel-jest needs the React Native preset to parse the Flow-typed `.js` files that
 * ship inside react-native itself.
 *
 * @param {import('@jest/types').Config.InitialOptions} [overrides] `moduleNameMapper` is merged
 * into the preset's; every other key replaces it.
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createNativeJestConfig({ moduleNameMapper, ...overrides } = {}) {
  return {
    preset: "react-native",
    roots: ["<rootDir>/src"],
    testMatch: ["**/*.native.test.{ts,tsx}"],
    transform: {
      // SWC handles our TypeScript/TSX source files
      "^.+\\.(t)sx?$": ["@swc/jest", { jsc: swcJsc }],
      // babel-jest handles .js files from React Native packages (they use Flow types)
      "^.+\\.jsx?$": "babel-jest",
    },
    transformIgnorePatterns: [`node_modules/(?!(${NATIVE_TRANSFORM_ALLOWLIST.join("|")})/.)`],
    modulePaths: ["<rootDir>"],
    moduleNameMapper: {
      "^jest/render\\.native$": "<rootDir>/jest/render/index.native.tsx",
      // resolved in the consumer: each devtools package declares lumen itself
      "^@ledgerhq/lumen-ui-rnative$":
        "<rootDir>/node_modules/@ledgerhq/lumen-ui-rnative/src/index.ts",
      "^@ledgerhq/lumen-design-core$": "<rootDir>/node_modules/@ledgerhq/lumen-design-core",
      "^@sbaiahmed1/react-native-blur$": here("mocks/react-native-blur.tsx"),
      "^react-native-worklets$": here("mocks/react-native-worklets.js"),
      "^expo-haptics$": here("mocks/expo-haptics.ts"),
      ...moduleNameMapper,
    },
    setupFilesAfterEnv: [here("setup/native.ts")],
    coverageReporters: coverageReporters("lcov.native.info"),
    reporters: ["default", sonarReporter("sonar-executionTests-native-report.xml")],
    ...overrides,
  };
}

module.exports = { createWebJestConfig, createNativeJestConfig };
