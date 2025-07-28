/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testRegex: ".integ.test.ts$",
  testPathIgnorePatterns: ["lib/", "lib-es/", "index.monitor.test.ts"],
  setupFiles: ["dotenv/config"],
};
