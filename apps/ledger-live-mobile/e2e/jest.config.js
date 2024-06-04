module.exports = async () => ({
  rootDir: "..",
  maxWorkers: process.env.CI ? 2 : 1,
  preset: "ts-jest",
  transform: {
    "^.+\\.(js|jsx)?$": "babel-jest",
    "^.+\\.(ts|tsx)?$": [
      "ts-jest",
      {
        babelConfig: "<rootDir>/e2e/babel.config.detox.js",
        tsconfig: "<rootDir>/e2e/tsconfig.test.json",
      },
    ],
  },
  setupFilesAfterEnv: ["<rootDir>/e2e/setup.ts"],
  testTimeout: 150000,
  testMatch: ["<rootDir>/e2e/**/*.spec.ts"],
  reporters: [
    "detox/runners/jest/reporter",
    [
      "jest-allure2-reporter",
      {
        resultsDir: "artifacts",
        testCase: {
          links: {
            issue: "https://ledgerhq.atlassian.net/browse/{{name}}",
            tms: "https://ledgerhq.atlassian.net/browse/{{name}}",
          },
        },
        overwrite: false,
      },
    ],
  ],
  globalSetup: "detox/runners/jest/globalSetup",
  globalTeardown: "detox/runners/jest/globalTeardown",
  testEnvironment: "detox/runners/jest/testEnvironment",
  testEnvironmentOptions: {
    eventListeners: [
      "jest-metadata/environment-listener",
      "jest-allure2-reporter/environment-listener",
      "detox-allure2-adapter",
    ],
  },
  verbose: true,
});
