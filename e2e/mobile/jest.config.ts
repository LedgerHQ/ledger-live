import type { Config } from "jest";
import { pathsToModuleNameMapper } from "ts-jest";
import type { ReporterOptions } from "jest-allure2-reporter";
import { compilerOptions } from "./tsconfig.json";

const jestAllure2ReporterOptions: ReporterOptions = {
  resultsDir: "artifacts",
  testCase: {
    links: {
      issue: "https://ledgerhq.atlassian.net/browse/{{name}}",
      tms: "https://ledgerhq.atlassian.net/browse/{{name}}",
    },
    labels: {
      host: process.env.RUNNER_NAME,
      worker: process.env.JEST_WORKER_ID,
    },
    status: ({ value }) => (value === "broken" ? "failed" : value),
  },
  overwrite: false,
  environment: async ({ $ }) => ({
    path: process.cwd(),
    "version.node": process.version,
    "version.jest": await $.manifest("jest", ["version"]),
    "package.name": await $.manifest(m => m.name),
    "package.version": await $.manifest(["version"]),
  }),
};

// Include problematic ESM packages and their submodules
const transformIncludePatterns = ["ky", "@polkadot"];

// Resolve workers: env wins; CI defaults to 2; otherwise undefined
function resolveMaxWorkers(): number | string | undefined {
  const fromEnv = process.env.JEST_MAX_WORKERS;
  if (fromEnv && /^\d+%?$/.test(fromEnv)) {
    return fromEnv; // e.g. "2" or "50%"
  }
  if (process.env.CI) return 2;
  return undefined;
}
const resolvedMaxWorkers = resolveMaxWorkers();

const config: Config = {
  rootDir: ".",
  preset: "ts-jest",
  transform: {
    "^.+\\.(js|jsx)$": require.resolve("babel-jest"),
    "^.+\\.(ts|tsx)?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
        babelConfig: true,
        diagnostics: false,
        isolatedModules: true,
      },
    ],
  },
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: "<rootDir>/",
    }),
    // Ensure baseUrl (".") non-relative imports from project root resolve in Jest workers
    "^helpers/(.*)$": "<rootDir>/helpers/$1",
    "^page$": "<rootDir>/page/index.ts",
    "^page/(.*)$": "<rootDir>/page/$1",
  },
  transformIgnorePatterns: [`node_modules/.pnpm/(?!(${transformIncludePatterns.join("|")}))`],

  setupFiles: ["<rootDir>/jest.setup.ts"],
  setupFilesAfterEnv: ["<rootDir>/setup.ts"],
  testMatch: ["<rootDir>/specs/**/*.spec.ts"],
  maxWorkers: process.env.CI ? 3 : "50%",
  workerIdleMemoryLimit: process.env.CI ? "1500MB" : undefined,
  testTimeout: 300_000,
  clearMocks: true,
  restoreMocks: true,
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
      "detox-allure2-adapter",
    ],
  },
  verbose: true,
  resetModules: true,
};

export default config;
