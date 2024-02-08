/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testRegex: ".(test|spec).[jt]sx?$",
  moduleDirectories: ["node_modules"],
  setupFiles: ["dotenv/config"],
};
