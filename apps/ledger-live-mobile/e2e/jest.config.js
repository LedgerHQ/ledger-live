module.exports = {
  maxWorkers: 1,
  preset: "ts-jest",
  setupFilesAfterEnv: ["<rootDir>/e2e/setup.ts"],
  testTimeout: 600000,
  rootDir: "..",
  testMatch: ["<rootDir>/e2e/**/*.spec.ts"],
  reporters: ["detox/runners/jest/reporter"],
  globalSetup: "detox/runners/jest/globalSetup",
  globalTeardown: "detox/runners/jest/globalTeardown",
  testEnvironment: "detox/runners/jest/testEnvironment",
  verbose: true,
};
