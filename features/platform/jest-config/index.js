const path = require("path");

const swcTransform = {
  "^.+\\.(t|j)sx?$": [
    "@swc/jest",
    { jsc: { target: "esnext", parser: { syntax: "typescript", tsx: true } } },
  ],
};

// Redirect the heavy Lumen/crypto-icons ESM barrels to a generic passthrough stub so tests
// don't need to transform them or install their peer graph. See mocks/*.js.
const webMocks = {
  "^@ledgerhq/lumen-ui-react(/.*)?$": path.join(__dirname, "mocks/passthrough-web.js"),
  "^@ledgerhq/crypto-icons$": path.join(__dirname, "mocks/passthrough-web.js"),
};

const nativeMocks = {
  // Stub react-native itself (Flow-typed ESM) so native tests run in a plain node env.
  // Mapped here (not jest.mock in a setup file) so it also intercepts react-native imports
  // from inside @testing-library/react-native.
  "^react-native$": path.join(__dirname, "mocks/react-native.js"),
  "^@ledgerhq/lumen-ui-rnative(/.*)?$": path.join(__dirname, "mocks/passthrough-native.js"),
  "^@ledgerhq/crypto-icons$": path.join(__dirname, "mocks/passthrough-native.js"),
};

/**
 * Dual-project jest config for a features/flow package.
 *
 * - web project: jsdom, matches *.web.test.ts(x) — Desktop.
 * - native project: node, matches *.native.test.ts(x) — Mobile.
 *
 * @param {import('@jest/types').Config.InitialOptions} [overrides]
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createFlowJestConfig(overrides = {}) {
  const testPathIgnorePatterns = ["lib/", "lib-es/", "node_modules/"];
  const coverageReporters = [
    "json",
    ["lcov", { file: "lcov.info", projectRoot: "../../../" }],
    "text",
  ];
  const base = {
    testPathIgnorePatterns,
    transform: swcTransform,
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
    coverageReporters,
  };

  return {
    collectCoverage: true,
    coverageDirectory: "./coverage/",
    reporters: [
      "default",
      [
        "jest-sonar",
        { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" },
      ],
    ],
    projects: [
      {
        ...base,
        displayName: "web",
        testEnvironment: "jsdom",
        testMatch: ["**/*.web.test.ts?(x)", "**/*.web.spec.ts?(x)"],
        moduleNameMapper: { ...webMocks },
        setupFilesAfterEnv: ["@testing-library/jest-dom", path.join(__dirname, "setup/web.js")],
      },
      {
        ...base,
        displayName: "native",
        testEnvironment: "node",
        testMatch: ["**/*.native.test.ts?(x)", "**/*.native.spec.ts?(x)"],
        moduleNameMapper: { ...nativeMocks },
      },
    ],
    ...overrides,
  };
}

module.exports = { createFlowJestConfig };
