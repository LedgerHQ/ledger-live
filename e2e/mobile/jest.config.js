/** @type {import("jest-allure2-reporter").ReporterOptions} */
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
  // Now the <rootDir> is the e2e folder, so we use /mobile for mobile-specific files.
  rootDir: "..",
  maxWorkers: process.env.CI ? 2 : 1,
  preset: "ts-jest",
  transform: {
    "^.+\\.(js|jsx)?$": "babel-jest",
    "^.+\\.(ts|tsx)?$": [
      "ts-jest",
      {
        babelConfig: "<rootDir>/mobile/babel.config.detox.js",
        tsconfig: "<rootDir>/mobile/tsconfig.json",
      },
    ],
  },
  setupFilesAfterEnv: ["<rootDir>/mobile/setup.ts"],
  testTimeout: 150000,
  testMatch: ["<rootDir>/mobile/specs/{*.spec.ts,!(speculos)/**/*.spec.ts}"],
  reporters: ["detox/runners/jest/reporter", ["jest-allure2-reporter", jestAllure2ReporterOptions]],
  globalSetup: "<rootDir>/mobile/jest.globalSetup.ts",
  globalTeardown: "<rootDir>/mobile/jest.globalTeardown.ts",
  testEnvironment: "<rootDir>/mobile/jest.environment.ts",
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
