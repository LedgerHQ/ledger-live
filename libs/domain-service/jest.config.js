const testPathIgnorePatterns = ["lib/", "lib-es/"];

let testRegex = ".(test|spec).[jt]sx?$";
if (process.env.IGNORE_INTEGRATION_TESTS) {
  testPathIgnorePatterns.push(".integration.(test|spec).[tj]sx?$");
}
if (process.env.ONLY_INTEGRATION_TESTS) {
  testRegex = ".integration.(test|spec).[jt]sx?$";
}
const reporters = ["default"];
if (process.env.CI) {
  reporters.push("github-actions");
}

const defaultConfig = {
  preset: "ts-jest",
  globals: {
    "ts-jest": {
      tsconfig: "./src/__tests__/tsconfig.json",
    },
  },
  testEnvironment: "node",
  coverageDirectory: "./coverage/",
  coverageReporters: ["json", "lcov", "clover"],
  reporters,
  collectCoverage: true,
  coveragePathIgnorePatterns: ["src/__tests__"],
  modulePathIgnorePatterns: [
    "<rootDir>/benchmark/.*",
    "<rootDir>/cli/.yalc/.*",
  ],
  testPathIgnorePatterns,
  testRegex,
  transformIgnorePatterns: ["/node_modules/(?!|@babel/runtime/helpers/esm/)"],
  moduleDirectories: ["node_modules"],
};

module.exports = {
  projects: [
    {
      ...defaultConfig,
      testPathIgnorePatterns: [...testPathIgnorePatterns, ".(test|spec).tsx"],
    },
    {
      ...defaultConfig,
      displayName: "dom",
      testEnvironment: "jsdom",
      testRegex: ".react.(test|spec).tsx",
    },
  ],
};
