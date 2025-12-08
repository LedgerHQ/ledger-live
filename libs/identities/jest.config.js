module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts", "**/__tests__/**/*.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
  ],
  moduleNameMapper: {
    "^@ledgerhq/(.*)$": "<rootDir>/../../libs/$1/src",
  },
};
