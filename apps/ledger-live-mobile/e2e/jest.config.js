/** @type {import('jest-allure2-reporter').ReporterOptions} */
const jestAllure2ReporterOptions = {
  resultsDir: "artifacts",
  testCase: {
    links: {
      issue: "https://ledgerhq.atlassian.net/browse/{{name}}",
      tms: "https://ledgerhq.atlassian.net/browse/{{name}}",
    },
    labels: {
      host: process.env.RUNNER_NAME,
    },
  },
  overwrite: false,
  environment: async ({ $ }) => {
    return {
      path: process.cwd(),
      "version.node": process.version,
      "version.jest": await $.manifest("jest", ["version"]),
      "package.name": await $.manifest(m => m.name),
      "package.version": await $.manifest(["version"]),
    };
  },
};

const transformIncludePatterns = ["ky"];

module.exports = async () => ({
  rootDir: "..",
  maxWorkers: 1,
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
  setupFilesAfterEnv: ["<rootDir>/e2e/setup.ts"],
  testTimeout: 150000,
  testMatch: ["<rootDir>/e2e/specs/**/*.spec.ts"],
  reporters: ["detox/runners/jest/reporter", ["jest-allure2-reporter", jestAllure2ReporterOptions]],
  globalSetup: "<rootDir>/e2e/jest.globalSetup.ts",
  testEnvironment: "<rootDir>/e2e/jest.environment.ts",
  testEnvironmentOptions: {
    eventListeners: [
      "jest-metadata/environment-listener",
      "jest-allure2-reporter/environment-listener",
      "detox-allure2-adapter",
    ],
  },
  transformIgnorePatterns: [`node_modules/.pnpm/(?!(${transformIncludePatterns.join("|")}))`],
  verbose: true,
  resetModules: true,
});
