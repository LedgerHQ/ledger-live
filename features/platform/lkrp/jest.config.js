module.exports = {
  testEnvironment: "node",
  passWithNoTests: true,
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest", { jsc: { target: "esnext" } }],
  },
  reporters: ["default", "@ledgerhq/test-quarantine/jest"],
  setupFilesAfterEnv: ["@ledgerhq/test-quarantine/jest-retries"],
};
