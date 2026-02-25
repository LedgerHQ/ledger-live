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

const esmDeps = ["ky"];

let testRegex: string | string[] = "(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$";
if (process.env.IGNORE_INTEGRATION_TESTS) {
  testPathIgnorePatterns.push(".*\\.integration\\.test\\.[tj]s");
}

if (process.env.ONLY_INTEGRATION_TESTS) {
  testRegex = "(/__tests__/.*|(\\.|/)integration\\.(test|spec))\\.[jt]sx?$";
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
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
    [`node_modules[\\\\|/].pnpm[\\\\|/](${esmDeps.join("|")}).+\\.jsx?$`]: [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  transformIgnorePatterns: ["/node_modules/(?!|@babel/runtime/helpers/esm/)"],
  moduleDirectories: ["node_modules", "cli/node_modules"],
  moduleNameMapper: {
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
  /**
   * Added because of this error happening when using toMatchInlineSnapshot:
   *     TypeError: prettier.resolveConfig.sync is not a function

      at runPrettier (../../node_modules/.pnpm/jest-snapshot@28.1.3/node_modules/jest-snapshot/build/InlineSnapshots.js:319:30)
   *
   * See: https://github.com/jestjs/jest/issues/14305#issuecomment-1627346697
   */
  prettierPath: null,
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
