const { resolveConfig } = require("detox/internals");

module.exports = async () => {
  const { device } = await resolveConfig();

  return {
    rootDir: "..",
    maxWorkers: process.env.CI ? (device.type === "ios.simulator" ? 3 : 2) : 1,
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
    testTimeout: 120000,
    testMatch: ["<rootDir>/e2e/**/*.spec.ts"],
    reporters: ["detox/runners/jest/reporter"],
    globalSetup: "detox/runners/jest/globalSetup",
    globalTeardown: "detox/runners/jest/globalTeardown",
    testEnvironment: "<rootDir>/e2e/environment.js",
    verbose: true,
  };
};
