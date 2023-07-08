/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  transform: {
    ".(test|spec).[jt]sx?$": [
      "ts-jest",
      {
        tsconfig: "./src/__tests__/tsconfig.json",
      },
    ],
  },
  testEnvironment: "node",
  coverageDirectory: "./coverage/",
  coverageReporters: ["json", "lcov", "clover"],
  collectCoverage: true,
  coveragePathIgnorePatterns: ["src/__tests__"],
  testRegex: ".(test|spec).[jt]sx?$",
  moduleDirectories: ["node_modules"],
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  modulePathIgnorePatterns: ["__tests__/fixtures"],
};
