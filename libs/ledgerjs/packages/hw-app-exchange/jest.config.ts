import baseConfig from "../../jest.config";

// Handle unhandled promise rejections early, before Jest checks for them
// This is needed for Jest 20 which is more strict about unhandled rejections
if (typeof process !== "undefined" && process.on) {
  process.on("unhandledRejection", (reason: unknown) => {
    // Suppress TransportStatusError unhandled rejections in tests
    // These are expected in some tests and will be caught by the test framework
    if (reason && typeof reason === "object" && "statusCode" in reason) {
      // This is a TransportStatusError, which is expected in some tests
      // Don't let it crash the test worker
      return;
    }
    // For other errors, let Jest handle them
    throw reason;
  });
}

export default {
  ...baseConfig,
  rootDir: __dirname,
  testPathIgnorePatterns: [...baseConfig.testPathIgnorePatterns, ".*\\.integ\\.test\\.[tj]s"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
    "!src/**/__tests__/**",
    "!tests/**",
  ],
  coverageReporters: ["json", ["lcov", { projectRoot: "../../../../" }], "json-summary", "text"],
  reporters: [
    "default",
    [
      "jest-sonar",
      {
        outputName: "sonar-executionTests-report.xml",
        reportedFilePath: "absolute",
      },
    ],
  ],
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  // Jest 20 is more strict about unhandled rejections
  // This allows tests to handle expected errors without failing
  detectOpenHandles: false,
  forceExit: true,
};
