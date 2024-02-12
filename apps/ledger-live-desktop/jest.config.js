/* eslint-disable @typescript-eslint/no-var-requires */
const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig");

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

const defaultConfig = {
  preset: "ts-jest",
  globals: {
    __DEV__: false,
    __APP_VERSION__: "2.0.0",
    __GIT_REVISION__: "xxx",
    __SENTRY_URL__: null,
    __PRERELEASE__: "null",
    __CHANNEL__: "null",
    "ts-jest": {
      isolatedModules: true,
      diagnostics: "warnOnly",
    },
  },
  testEnvironment: "node",
  testPathIgnorePatterns,
  globalSetup: "<rootDir>/tests/setup.ts",
  moduleDirectories: ["node_modules"],
  modulePaths: [compilerOptions.baseUrl],
  setupFiles: ["jest-canvas-mock", "<rootDir>/tests/jestSetup.ts"],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
};

module.exports = {
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.test.{ts,tsx}", "!src/**/*.spec.{ts,tsx}"],
  coverageReporters: ["json", "lcov", "json-summary"],
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
      setupFiles: [...defaultConfig.setupFiles, "<rootDir>/tests/jestJSDOMSetup.ts"],
      displayName: "dom",
      testEnvironment: "jsdom",
      transform: {
        "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
          "<rootDir>/tests/fileTransformer.js",
      },
      testRegex: "(/__tests__/.*|(\\.|/)react\\.test|spec)\\.tsx",
      testPathIgnorePatterns,
      moduleNameMapper: {
        ...defaultConfig.moduleNameMapper,
        "~/(.*)": "<rootDir>/src/$1",
        "\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
          "<rootDir>/fileMock.js",
        electron: "<rootDir>/tests/mocks/electron.ts",
        "react-spring": require.resolve("react-spring"),
        uuid: require.resolve("uuid"),
        "@braze/web-sdk": require.resolve("@braze/web-sdk"),
      },
    },
  ],
};
