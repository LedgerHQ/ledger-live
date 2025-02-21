module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  collectCoverageFrom: [
    "src/**/*.{ts,js}",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
    "!src/**/__integration__/**",
    "!src/**/__integrations__/**",
    "!src/**/__tests__/**",
  ],
  coverageReporters: ["json", ["lcov", { projectRoot: "../" }], "json-summary"],
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
};
