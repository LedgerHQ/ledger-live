export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testRegex: ".test.ts$",
  collectCoverage: true,
  testPathIgnorePatterns: ["packages/*/lib-es", "packages/*/lib"],
  coveragePathIgnorePatterns: ["packages/create-dapp"],
  passWithNoTests: true,
  // collectCoverageFrom: ["packages/**/src/*.ts"],
};
