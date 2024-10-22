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
  "src/.*/shared\\.(ts|tsx)$",
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
  "@polkadot/x-fetch": "<rootDir>/__mocks__/x-fetch.js",
  "@polkadot/x-ws": "<rootDir>/__mocks__/x-ws.js",
};

const commonConfig = {
  testEnvironment: "jsdom",
  globals: {
    __DEV__: false,
    __APP_VERSION__: "2.0.0",
    __GIT_REVISION__: "xxx",
    __SENTRY_URL__: null,
    __PRERELEASE__: "null",
    __CHANNEL__: "null",
  },
  moduleNameMapper,
  testPathIgnorePatterns,
  setupFiles: ["jest-canvas-mock", "./jest.polyfills.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/jestSetup.js"],
  extensionsToTreatAsEsm: [".ts", ".tsx", ".jsx"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/tests/fileTransformer.js",
  },
  globalSetup: "<rootDir>/tests/setup.ts",
  moduleDirectories: ["node_modules", "./tests"],
  modulePaths: [compilerOptions.baseUrl],
  resolver: "<rootDir>/scripts/resolver.js",
  testEnvironmentOptions: {
    customExportConditions: [""],
  },
};

module.exports = {
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
    "!src/**/__integration__/**",
    "!src/**/__tests__/**",
  ],
  coverageReporters: ["json", "lcov", "json-summary"],
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-test-execution-report.xml", reportedFilePath: "absolute" }],
  ],
  silent: false,
  verbose: true,
  projects: [
    {
      ...commonConfig,
      displayName: "default",
      testPathIgnorePatterns: [
        ...testPathIgnorePatterns,
        "(/__tests__/.*|(\\.|/)react\\.test|spec)\\.tsx",
      ],
      testMatch: ["**/src/**/*.test.(ts|tsx)"],
    },
    {
      ...commonConfig,
      displayName: "dom",
      testRegex: "(/__tests__/.*|(\\.|/)react\\.test|spec)\\.tsx",
    },
  ],
};
