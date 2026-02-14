/* eslint-disable @typescript-eslint/no-var-requires */
const { compilerOptions } = require("./tsconfig");

// Helper function to convert TypeScript paths to Jest moduleNameMapper
// This replaces pathsToModuleNameMapper from ts-jest which is not available in @swc/jest
function pathsToModuleNameMapper(paths, { prefix = "<rootDir>/" } = {}) {
  const jestPaths = {};
  if (!paths) return jestPaths;

  Object.keys(paths).forEach(pathKey => {
    const pathValues = Array.isArray(paths[pathKey]) ? paths[pathKey] : [paths[pathKey]];
    pathValues.forEach(pathValue => {
      // Convert TypeScript path pattern to Jest regex pattern
      // Use /\*$/ for key (wildcard at end) but /\*/ for value (wildcard can be anywhere)
      const jestKey = pathKey.replace(/\*$/, "(.*)");
      const jestValue = pathValue.replace(/\*/, "$1");
      jestPaths[jestKey] = `${prefix}${jestValue}`;
    });
  });

  return jestPaths;
}

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
  ".*\\.lottie$": "<rootDir>/fileMock.js",
  ...pathsToModuleNameMapper(compilerOptions.paths),
  "~/(.*)": "<rootDir>/src/$1",
  "^@features/(.*)$": "<rootDir>/../../features/$1/src",
  "^@ledgerhq/(lumen-ui-react|lumen-design-core)$": "<rootDir>/node_modules/@ledgerhq/$1",
  "\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|lottie)$":
    "<rootDir>/fileMock.js",
  "@lottiefiles/dotlottie-react": "<rootDir>/tests/mocks/dotlottie-react.tsx",
  "styled-components": require.resolve("styled-components"),
  electron: "<rootDir>/tests/mocks/electron.ts",
  uuid: require.resolve("uuid"),
  "react-spring": require.resolve("react-spring"),
  "^react-redux": "<rootDir>/node_modules/react-redux",
  "@braze/web-sdk": require.resolve("@braze/web-sdk"),
  "@polkadot/x-fetch": "<rootDir>/__mocks__/x-fetch.js",
  "@polkadot/x-ws": "<rootDir>/__mocks__/x-ws.js",
};

const transformIncludePatterns = ["ky", "@ledgerhq\\+lumen-ui-react"];

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
  transformIgnorePatterns: [`node_modules/.pnpm/(?!(${transformIncludePatterns.join("|")}))`],
};

module.exports = {
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
    "!src/**/__integration__/**",
    "!src/**/__integrations__/**",
    "!src/**/__tests__/**",
  ],
  coverageReporters: ["json", ["lcov", { projectRoot: "../" }], "json-summary"],
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
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
