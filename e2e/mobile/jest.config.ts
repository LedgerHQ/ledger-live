import type { Config } from "jest";
import { pathsToModuleNameMapper } from "ts-jest";
import type { ReporterOptions } from "jest-allure2-reporter";
import { compilerOptions } from "./tsconfig.json";
import { DetoxAllure2AdapterOptions } from "detox-allure2-adapter";
import {
  getDeviceFirmwareVersion,
  getSpeculosModel,
} from "@ledgerhq/live-common/e2e/speculosAppVersion";

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
    path: process.cwd(),
    "version.node": process.version,
    "version.jest": await $.manifest("jest", ["version"]),
    "package.name": await $.manifest(m => m.name),
    "package.version": await $.manifest(["version"]),
  }),
};

const detoxAllure2AdapterOptions: DetoxAllure2AdapterOptions = {
  deviceLogs: false,
  deviceScreenshots: false,
  deviceVideos: false,
  deviceViewHierarchy: false,
};

// Include problematic ESM packages and their submodules
const ESM_PACKAGES = ["ky", "@polkadot"].join("|");

const config: Config = {
  rootDir: ".",
  maxWorkers: process.env.CI ? 3 : 1,
  preset: "ts-jest",
  transform: {
    "^.+\\.(js|jsx)$": require.resolve("babel-jest"),
    "^.+\\.(ts|tsx)?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
        babelConfig: true,
        diagnostics: false,
      },
    ],
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>/",
  }),
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
