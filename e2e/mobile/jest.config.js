// tsconfig-paths for the Jest controller (globalSetup/globalTeardown) and workers.
// Must be first (CJS has no hoisting). Explicit baseUrl: __dirname keeps this CWD-independent.
const { register } = require("tsconfig-paths");
const { compilerOptions } = require("./tsconfig.json");
register({ baseUrl: __dirname, paths: compilerOptions.paths });

// Workers are separate processes that don't inherit the register() call above.
// Setting NODE_OPTIONS here propagates to workers via fork() environment inheritance.
const tsconfigPathsRegister = require.resolve("tsconfig-paths/register");
if (!process.env.NODE_OPTIONS?.includes(tsconfigPathsRegister)) {
  process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, `--require ${tsconfigPathsRegister}`]
    .filter(Boolean)
    .join(" ");
}

const path = require("node:path");
const { parseExtraFeatureFlags } = require("@ledgerhq/live-e2e-shared/featureFlagsJsonUtils");

function pathsToModuleNameMapper(paths, { prefix = "<rootDir>/" } = {}) {
  const jestPaths = {};
  if (!paths) return jestPaths;

  Object.keys(paths).forEach(pathKey => {
    const pathEntry = paths[pathKey];
    const pathValues = Array.isArray(pathEntry) ? pathEntry : [pathEntry];
    pathValues.forEach(pathValue => {
      const jestKey = `^${pathKey.replace(/\*$/, "(.*)")}$`;
      const jestValue = pathValue.replace(/^\.\//, "").replace(/\*/g, "$1");
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
      // Bare spec-file basename (never a directory) so the rerun filter stays portable:
      // `filePath` may be an array of path segments or an absolute/relative path string.
      sourceFile: ({ filePath }) => {
        const fp = Array.isArray(filePath) ? filePath[filePath.length - 1] : filePath;
        return path.basename(String(fp ?? ""));
      },
    },
    status: ({ value }) => (value === "broken" ? "failed" : value),
    historyId: ({ value }) => `${value}:${platform}`,
  },
  overwrite: false,
  environment: async ({ $ }) => ({
    SPECULOS_DEVICE: process.env.SPECULOS_DEVICE,
    SPECULOS_FIRMWARE_VERSION: process.env.SPECULOS_FIRMWARE_VERSION,
    MOBILE_DEVICE: process.env.DEVICE_INFO || "Unknown device",
    E2E_MOBILE_FEATURE_FLAGS: process.env.E2E_MOBILE_FEATURE_FLAGS,
    E2E_FEATURE_FLAGS_JSON: JSON.stringify(
      parseExtraFeatureFlags(process.env.E2E_FEATURE_FLAGS_JSON),
    ),
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
    "^.+\\.(t|j)sx?$": [
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
    // jest does not read tsconfig path mapping so we replicate it here
    ...pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: "<rootDir>/",
    }),
  },
  transformIgnorePatterns: [`/node_modules/(?!(${ESM_PACKAGES})/)`],

  setupFilesAfterEnv: ["<rootDir>/setup.ts"],
  testMatch: ["<rootDir>/specs/**/*.spec.ts"],
  // CI shards exclude `.skip.spec.ts` (apps/ledger-live-mobile/scripts/shard-tests.mjs).
  testPathIgnorePatterns: ["\\.skip\\.spec\\.ts$"],
  testTimeout: 60_000 * 6,
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
