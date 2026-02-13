import type { Config } from "jest";
import type { ReporterOptions } from "jest-allure2-reporter";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { compilerOptions } = require("./tsconfig.json");

function pathsToModuleNameMapper(
  paths: Record<string, string[]>,
  { prefix = "<rootDir>/" }: { prefix?: string } = {},
): Record<string, string> {
  const jestPaths: Record<string, string> = {};
  if (!paths) return jestPaths;

  Object.keys(paths).forEach(pathKey => {
    const pathEntry = paths[pathKey];
    const pathValues: string[] = Array.isArray(pathEntry) ? pathEntry : [pathEntry];
    pathValues.forEach((pathValue: string) => {
      const jestKey = pathKey.replace(/\*$/, "(.*)");
      const jestValue = pathValue.replace(/\*$/, "$1");
      jestPaths[jestKey] = `${prefix}${jestValue}`;
    });
  });

  return jestPaths;
}
import {
  getDeviceFirmwareVersion,
  getSpeculosModel,
} from "@ledgerhq/live-common/e2e/speculosAppVersion";
import { getDeviceOS, getDeviceVersion } from "./utils/deviceInfo";

const jestAllure2ReporterOptions: ReporterOptions = {
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
  },
  overwrite: false,
  environment: async ({ $ }) => ({
    SPECULOS_DEVICE: process.env.SPECULOS_DEVICE,
    SPECULOS_FIRMWARE_VERSION: await getDeviceFirmwareVersion(getSpeculosModel()),
    DEVICE_OS: getDeviceOS(),
    DEVICE_VERSION: getDeviceVersion(),
    path: process.cwd(),
    "version.node": process.version,
    "version.jest": await $.manifest("jest", ["version"]),
    "package.name": await $.manifest(m => m.name),
    "package.version": await $.manifest(["version"]),
  }),
};

import type { DetoxAllure2AdapterOptions } from "detox-allure2-adapter";

// Video recording is handled by patched detox-allure2-adapter via DETOX_ENABLE_VIDEO env var in globalSetup
const detoxAllure2AdapterOptions: DetoxAllure2AdapterOptions = {
  deviceLogs: false,
  deviceScreenshots: false,
  deviceVideos: false,
  deviceViewHierarchy: false,
  onError: "warn",
};

const ESM_PACKAGES = ["ky", "@polkadot"].join("|");

const config: Config = {
  rootDir: ".",
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
    ["jest-allure2-reporter", jestAllure2ReporterOptions as Record<string, unknown>],
  ],
  globalSetup: "<rootDir>/jest.globalSetup.ts",
  globalTeardown: "<rootDir>/jest.globalTeardown.ts",
  testEnvironment: "<rootDir>/jest.environment.ts",
  testEnvironmentOptions: {
    eventListeners: [
      "jest-metadata/environment-listener",
      "jest-allure2-reporter/environment-listener",
      ["detox-allure2-adapter", detoxAllure2AdapterOptions],
    ],
  },
  verbose: true,
  resetModules: true,
};

export default config;
