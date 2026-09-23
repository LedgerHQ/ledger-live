// Shared jest config for domain/* packages. These are pure logic: node environment, no DOM, no
// React, tests co-located under src/.
//
// `projectRoot` below assumes the consumer sits three levels down (domain/entity/x, domain/api/x),
// which every domain package does. It is the path Sonar resolves lcov paths against.

const swcTransform = {
  "^.+\\.(t|j)sx?$": ["@swc/jest", { jsc: { target: "esnext" } }],
};

const coverageReporters = [
  "json",
  ["lcov", { file: "lcov.info", projectRoot: "../../../" }],
  "text",
];

const reporters = [
  "default",
  ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  "@ledgerhq/test-quarantine/jest",
];

/**
 * @param {import('@jest/types').Config.InitialOptions} [overrides]
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createDomainJestConfig(overrides = {}) {
  return {
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    testMatch: ["**/*.test.ts"],
    transform: swcTransform,
    coverageReporters,
    reporters,
    setupFilesAfterEnv: ["@ledgerhq/test-quarantine/jest-retries"],
    ...overrides,
  };
}

module.exports = { createDomainJestConfig };
