import { createSharedJestConfig } from "@support/jest/shared";

// The packages sit four levels below the repository root and set their own rootDir.
export default createSharedJestConfig(
  {
    roots: ["<rootDir>"],
    testMatch: undefined,
    testRegex: ".test.ts$",
    collectCoverage: true,
    testPathIgnorePatterns: ["packages/*/lib-es", "packages/*/lib"],
    coveragePathIgnorePatterns: ["packages/create-dapp"],
    passWithNoTests: true,
  },
  { esm: true, projectRoot: "../../../../" },
);
