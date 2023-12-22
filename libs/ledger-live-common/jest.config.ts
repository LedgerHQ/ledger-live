const testPathIgnorePatterns = [
  "benchmark/",
  "tools/",
  "mobile-test-app/",
  "lib/",
  "lib-es/",
  ".yalc",
  "cli/",
  "test-helpers/",
];

let testRegex = "(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$";
if (process.env.IGNORE_INTEGRATION_TESTS) {
  testPathIgnorePatterns.push(".*\\.integration\\.test\\.[tj]s");
}

if (process.env.ONLY_INTEGRATION_TESTS) {
  testRegex = "(/__tests__/.*|(\\.|/)integration\\.(test|spec))\\.[jt]sx?$";
}

const reporters = ["default"];
if (process.env.CI) {
  reporters.push("github-actions");
}

const defaultConfig = {
  preset: "ts-jest",
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
  testEnvironment: "jsdom",
  reporters,
  coveragePathIgnorePatterns: ["src/__tests__/test-helpers"],
  modulePathIgnorePatterns: [
    "__tests__/fixtures",
    "<rootDir>/benchmark/.*",
    "<rootDir>/cli/.yalc/.*",
  ],
  testPathIgnorePatterns,
  testRegex,
  transformIgnorePatterns: ["/node_modules/(?!|@babel/runtime/helpers/esm/)"],
  moduleDirectories: ["node_modules", "cli/node_modules"],
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
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.{ts,tsx}"],
  coverageReporters: ["json", "lcov", "clover", "json-summary"],
  projects: [
    {
      ...defaultConfig,
      testPathIgnorePatterns: [
        ...testPathIgnorePatterns,
        "(/__tests__/.*|(\\.|/)react\\.test|spec)\\.tsx",
      ],
    },
    {
      ...defaultConfig,
      displayName: "dom",
      testEnvironment: "jsdom",
      testRegex: "(/__tests__/.*|(\\.|/)react\\.test|spec)\\.tsx",
    },
  ],
};
