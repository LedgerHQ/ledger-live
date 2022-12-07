module.exports = {
  maxWorkers: 1,
  preset: "ts-jest",
  setupFilesAfterEnv: ["<rootDir>/e2e/setup.ts"],
  testTimeout: 120000,
  rootDir: "..",
  testMatch: ["<rootDir>/e2e/**/*.spec.ts"],
  reporters: ["detox/runners/jest/reporter"],
  globalSetup: "detox/runners/jest/globalSetup",
  globalTeardown: "detox/runners/jest/globalTeardown",
  testEnvironment: "<rootDir>/e2e/environment.js",
  verbose: true,
};
