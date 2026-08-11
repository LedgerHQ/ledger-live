import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const testPathIgnorePatterns = [
  "benchmark/",
  "tools/",
  "mobile-test-app/",
  "lib/",
  "lib-es/",
  ".yalc",
  "cli/",
  "src/__tests__/(test-helpers/|handlers/|server\\.ts)",
];

// Dependencies shipped as ESM that jest has to transform. Matched against pnpm's store directory
// name, where a scope separator becomes a `+` (`@scure+base@1.1.0`), hence the escaped `\+`.
const esmDeps = ["ky@", "@mysten\\+", "@scure\\+", "@noble\\+", "@babel\\+runtime"];

// Some of those deps ship a `sourceMappingURL` comment but no `.map` file (e.g. @scure/base), which
// makes swc log `failed to read input source map` for every file it transforms.
const swcOptions = { inputSourceMap: false, jsc: { target: "esnext" } };

// Integration tests that depend on flaky third-party/external nodes and explorers.
// Excluded from the per-PR and daily integration runs; executed weekly instead
// (see .github/workflows/test-integration-weekly.yml).
const weeklyIntegrationTests = [
  "src/families/cosmos/lastBlock.integration.test.ts",
  "src/families/cosmos/datasets/cosmos.integration.test.ts",
  "src/families/cosmos/datasets/persistence.integration.test.ts",
  "src/families/cosmos/datasets/stargaze.integration.test.ts",
  "src/families/cosmos/datasets/quicksilver.integration.test.ts",
  "src/families/cosmos/datasets/xion.integration.test.ts",
  "src/families/mina/bridge.integration.test.ts",
];

const weeklyIntegrationTestsRegex = weeklyIntegrationTests.map(
  p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\//g, "[/\\\\]") + "$",
);

let testRegex: string | string[] = "(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$";
if (process.env.IGNORE_INTEGRATION_TESTS) {
  testPathIgnorePatterns.push(".*\\.integration\\.test\\.[tj]s");
}

if (process.env.ONLY_INTEGRATION_TESTS) {
  testRegex = "(/__tests__/.*|(\\.|/)integration\\.(test|spec))\\.[jt]sx?$";
  // Keep flaky network-only tests out of PR + daily runs.
  testPathIgnorePatterns.push(...weeklyIntegrationTestsRegex);
}

if (process.env.ONLY_WEEKLY_INTEGRATION_TESTS) {
  testRegex = weeklyIntegrationTestsRegex;
}

if (process.env.USE_BACKEND_MOCKS) {
  testRegex = [
    "algorand/bridge.integration.test.ts",
    // $ to not match with test.snap files
  ];
}

const reporters = [
  "default",
  [
    "jest-sonar",
    {
      outputName: "sonar-executionTests-report.xml",
      reportedFilePath: "absolute",
    },
  ],
];
if (process.env.CI) {
  reporters.push("github-actions");
}

const defaultConfig = {
  globals: {
    Buffer: Uint8Array,
  },
  testEnvironment: "node",
  reporters,
  setupFiles: ["./jest.polyfills.js"],
  setupFilesAfterEnv: [
    "@ledgerhq/wallet-framework-test-setup",
    "<rootDir>/src/__tests__/test-helpers/setup-registry.ts",
  ],
  coveragePathIgnorePatterns: ["src/__tests__/test-helpers", "src/wallet-api/SmartWebsocket.ts"], // Type issue with event in SmartWebsocket.ts breaking coverage report
  modulePathIgnorePatterns: [
    "__tests__/fixtures",
    "__tests__/migration",
    "<rootDir>/benchmark/.*",
    "<rootDir>/cli/.yalc/.*",
    "<rootDir>/lib-es",
    "<rootDir>/lib",
  ],
  testPathIgnorePatterns,
  testRegex,
  coverageReporters: ["json", ["lcov", { projectRoot: "../../" }], "json-summary", "text"],
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest", swcOptions],
    [`node_modules[\\\\|/].pnpm[\\\\|/](${esmDeps.join("|")}).+\\.(js|jsx|mjs)$`]: [
      "@swc/jest",
      swcOptions,
    ],
  },
  // Only the ESM deps above are transformed. The previous pattern was
  // `/node_modules/(?!|@babel/runtime/helpers/esm/)`, whose empty first alternative makes the
  // negative lookahead always fail, so nothing was ignored and swc transformed all of node_modules.
  transformIgnorePatterns: [`node_modules[\\\\|/]\\.pnpm[\\\\|/](?!(${esmDeps.join("|")}))`],
  moduleDirectories: ["node_modules", "cli/node_modules"],
  moduleNameMapper: {
    "^buffer$": "<rootDir>/jest.buffer-shim.js",
    "^(\\.{1,2}/.+)\\.js$": "$1",
    "^@tests/(.*)$": "<rootDir>/src/__tests__/$1",
    "^@tests$": "<rootDir>/src/__tests__/server",
    // TODO: Remove this once we upgrade all projects React 19
    "^react-dom/client$": require.resolve("react-dom/client"),
    "^react/jsx-runtime$": require.resolve("react/jsx-runtime"),
    "^react/jsx-dev-runtime$": require.resolve("react/jsx-dev-runtime"),
    "^react-dom$": require.resolve("react-dom"),
    "^react$": require.resolve("react"),
    "react-test-renderer": require.resolve("react-test-renderer"),
  },
};

export default {
  globalSetup: process.env.UPDATE_BACKEND_MOCKS
    ? "<rootDir>/src/__tests__/test-helpers/bridgeSetupUpdateMocks.ts"
    : process.env.USE_BACKEND_MOCKS
      ? "<rootDir>/src/__tests__/test-helpers/bridgeSetupUseMocks.ts"
      : undefined,
  globalTeardown: process.env.UPDATE_BACKEND_MOCKS
    ? "<rootDir>/src/__tests__/test-helpers/bridgeTeardownUpdateMocks.ts"
    : process.env.USE_BACKEND_MOCKS
      ? "<rootDir>/src/__tests__/test-helpers/bridgeTeardownUseMocks.ts"
      : undefined,
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.{ts,tsx}"],
  reporters: defaultConfig.reporters,
  coverageReporters: ["json", "lcov", "clover", "json-summary"],
  projects: [defaultConfig],
};
