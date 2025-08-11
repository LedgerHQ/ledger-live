/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testRegex: ".integration.test.ts$",
  testPathIgnorePatterns: ["lib/", "lib-es/", "bridge.integration.test.ts"],
  testTimeout: 60_000,
  globals: {
    __APP_VERSION__: "2.123.0",
  },
};
