module.exports = {
  rootDir: "..",
  maxWorkers: 1,
  preset: "ts-jest",
  globals: {
    "ts-jest": {
      babelConfig: true,
    },
  },
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        babelConfig: "<rootDir>/e2e/babel.config.detox.js",
      },
    ],
  },
  setupFilesAfterEnv: ["<rootDir>/e2e/setup.ts"],
  testTimeout: 120000,
  testMatch: ["<rootDir>/e2e/**/*.spec.ts"],
  reporters: ["detox/runners/jest/reporter"],
  globalSetup: "detox/runners/jest/globalSetup",
  globalTeardown: "detox/runners/jest/globalTeardown",
  testEnvironment: "<rootDir>/e2e/environment.js",
  verbose: true,
};
