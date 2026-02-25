const testPathIgnorePatterns = ["lib/", "lib-es/", "node_modules/"];

const baseTransform = {
  "^.+\\.(t|j)sx?$": [
    "@swc/jest",
    {
      jsc: {
        target: "esnext",
        parser: {
          syntax: "typescript",
          tsx: true,
        },
      },
    },
  ],
};

const baseConfig = {
  testPathIgnorePatterns,
  transform: baseTransform,
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  coverageDirectory: "./coverage/",
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../" }], "text"],
};

module.exports = {
  collectCoverage: true,
  reporters: [
    "default",
  ],
  projects: [
    // Web tests (Desktop) - uses jsdom environment
    {
      ...baseConfig,
      displayName: "web",
      testEnvironment: "jsdom",
      testMatch: ["**/*.web.test.ts?(x)", "**/*.web.spec.ts?(x)"],
      setupFilesAfterEnv: ["@testing-library/jest-dom", "<rootDir>/jest.setup.web.js"],
    },
    // Native tests (Mobile) - uses node environment with RN mocks
    {
      ...baseConfig,
      displayName: "native",
      testEnvironment: "node",
      testMatch: ["**/*.native.test.ts?(x)", "**/*.native.spec.ts?(x)"],
      setupFilesAfterEnv: ["<rootDir>/jest.setup.native.js"],
    },
  ],
};
