module.exports = {
  preset: "ts-jest",
  coverageDirectory: "coverage",
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  setupFilesAfterEnv: ["jest-expect-message", "dotenv/config"],
};
