const transformIncludePatterns = ["ky"];

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
  testMatch: ["<rootDir>/e2e/specs/**/*.spec.ts"],
  reporters: ["detox/runners/jest/reporter"],
  testEnvironment: "<rootDir>/e2e/jest.environment.ts",
  transformIgnorePatterns: [`node_modules/.pnpm/(?!(${transformIncludePatterns.join("|")}))`],
  verbose: true,
  resetModules: true,
});
