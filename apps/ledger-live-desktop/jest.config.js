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

const moduleNameMapper = {
  ...pathsToModuleNameMapper(compilerOptions.paths),
  "~/(.*)": "<rootDir>/src/$1",
  "\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
    "<rootDir>/fileMock.js",
  "styled-components": require.resolve("styled-components"),
  electron: "<rootDir>/tests/mocks/electron.ts",
  uuid: require.resolve("uuid"),
  "react-spring": require.resolve("react-spring"),
  "@braze/web-sdk": require.resolve("@braze/web-sdk"),
};

const commonConfig = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
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
  moduleNameMapper,
  testPathIgnorePatterns,
  setupFiles: ["jest-canvas-mock", "<rootDir>/tests/jestSetup.js"],
  globalSetup: "<rootDir>/tests/setup.ts",
  moduleDirectories: ["node_modules"],
  modulePaths: [compilerOptions.baseUrl],
  resolver: "<rootDir>/scripts/resolver.js",
};

module.exports = {
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.test.{ts,tsx}", "!src/**/*.spec.{ts,tsx}"],
  coverageReporters: ["json", "lcov", "json-summary"],
  projects: [
    {
      ...commonConfig,
      displayName: "default",
      testPathIgnorePatterns: [
        ...testPathIgnorePatterns,
        "(/__tests__/.*|(\\.|/)react\\.test|spec)\\.tsx",
      ],
      transform: {
        "^.+\\.tsx?$": "ts-jest",
        "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
          "<rootDir>/tests/fileTransformer.js",
      },
    },
    {
      ...commonConfig,
      displayName: "dom",
      setupFiles: [...commonConfig.setupFiles, "<rootDir>/tests/jestJSDOMSetup.ts"],
      transform: {
        "^.+\\.tsx?$": "ts-jest",
        "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
          "<rootDir>/tests/fileTransformer.js",
      },
      testRegex: "(/__tests__/.*|(\\.|/)react\\.test|spec)\\.tsx",
    },
  ],
};
