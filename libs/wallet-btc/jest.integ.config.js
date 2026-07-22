/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testRegex: ".integ.test.ts$",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  testTimeout: 60_000,
  forceExit: true,
  passWithNoTests: true,
  moduleNameMapper: {
    "^@ledgerhq/wallet-btc/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
};
