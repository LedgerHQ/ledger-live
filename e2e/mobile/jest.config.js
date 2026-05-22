const { compilerOptions } = require("./tsconfig.json");

function pathsToModuleNameMapper(paths, { prefix = "<rootDir>/" } = {}) {
  const jestPaths = {};
  if (!paths) return jestPaths;

  Object.keys(paths).forEach(pathKey => {
    // tsconfig uses "*": ["./*"] instead of baseUrl; mapping (.*) -> $1 breaks every module in Jest
    if (pathKey === "*") return;
    const pathEntry = paths[pathKey];
    const pathValues = Array.isArray(pathEntry) ? pathEntry : [pathEntry];
    pathValues.forEach(pathValue => {
      const jestKey = pathKey.replace(/\*$/, "(.*)");
      const jestValue = pathValue.replace(/\*/g, "$1");
      jestPaths[jestKey] = `${prefix}${jestValue}`;
    });
  });

  return jestPaths;
}

const platform = process.env.DETOX_CONFIGURATION?.startsWith("ios") ? "ios" : "android";

const jestAllure2ReporterOptions = {
  extends: "detox-allure2-adapter/preset-detox",
  resultsDir: "artifacts",
  testCase: {
    links: {
      issue: "https://ledgerhq.atlassian.net/browse/{{name}}",
      tms: "https://ledgerhq.atlassian.net/browse/{{name}}",
    },
    labels: {
      host: process.env.RUNNER_NAME,
    },
    status: ({ value }) => (value === "broken" ? "failed" : value),
    historyId: ({ value }) => `${value}:${platform}`,
  },
  overwrite: false,
  environment: async ({ $ }) => ({
    SPECULOS_DEVICE: process.env.SPECULOS_DEVICE,
    SPECULOS_FIRMWARE_VERSION: process.env.SPECULOS_FIRMWARE_VERSION,
    MOBILE_DEVICE: process.env.DEVICE_INFO || "Unknown device",
    path: process.cwd(),
    "version.node": process.version,
    "version.jest": await $.manifest("jest", ["version"]),
    "package.name": await $.manifest(m => m.name),
    "package.version": await $.manifest(["version"]),
  }),
};

// Video recording is handled by patched detox-allure2-adapter via DETOX_ENABLE_VIDEO env var in globalSetup
const detoxAllure2AdapterOptions = {
  deviceLogs: true,
  deviceScreenshots: false,
  deviceVideos: false,
  deviceViewHierarchy: false,
  onError: "warn",
};

const ESM_PACKAGES = ["ky", "@polkadot", "@ledgerhq", "@shared", "@features", "@domain"].join("|");

const config = {
  rootDir: ".",
  modulePaths: [compilerOptions.baseUrl ?? "."],
  maxWorkers: process.env.CI ? 3 : 1,
  transform: {
    "^.+\\.(js|jsx)?$": "babel-jest",
    "^.+\\.(ts|tsx)?$": [
      "@swc/jest",
      {
        jsc: {
          target: "es2022",
          parser: {
            syntax: "typescript",
            tsx: true,
            decorators: true,
            dynamicImport: true,
          },
          transform: {
            react: {
              runtime: "automatic",
            },
          },
        },
        sourceMaps: "inline",
        module: {
          type: "commonjs",
        },
      },
    ],
  },
  moduleNameMapper: {
    "^@ledgerhq/live-common/e2e/(.*)$": "<rootDir>/../../libs/ledger-live-common/src/e2e/$1",
    ...pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: "<rootDir>/",
    }),
  },
  transformIgnorePatterns: [`/node_modules/(?!(${ESM_PACKAGES})/)`],

  setupFilesAfterEnv: ["<rootDir>/setup.ts"],
  testMatch: ["<rootDir>/specs/**/*.spec.ts"],
  testTimeout: 300_000,
  reporters: [
    "detox/runners/jest/reporter",
    ["jest-allure2-reporter", jestAllure2ReporterOptions],
    ...(process.env.CI ? [["github-actions", { silent: false }]] : []),
  ],
  globalSetup: "<rootDir>/jest.globalSetup.ts",
  globalTeardown: "<rootDir>/jest.globalTeardown.ts",
  testEnvironment: "<rootDir>/jest.environment.ts",
  testEnvironmentOptions: {
    customConditions: ["node"],
    eventListeners: [
      "jest-metadata/environment-listener",
      "jest-allure2-reporter/environment-listener",
      ["detox-allure2-adapter", detoxAllure2AdapterOptions],
    ],
  },
  verbose: true,
  resetModules: true,
};

module.exports = config;
