const transform = {
  "^.+\\.(t|j)sx?$": [
    "@swc/jest",
    {
      jsc: {
        target: "esnext",
        parser: { syntax: "typescript", tsx: true },
        transform: { react: { runtime: "automatic" } },
      },
    },
  ],
};

// Imports carry no platform suffix: each project resolves `./X` to its own `X.web` or `X.native`.
const platformExtensions = platform => [
  `${platform}.tsx`,
  `${platform}.ts`,
  "tsx",
  "ts",
  "js",
  "jsx",
  "json",
  "node",
];

// Both projects render into jsdom: the native tests mock styled-components/native and Lumen RN.
function project(platform) {
  return {
    displayName: platform,
    testEnvironment: "jsdom",
    roots: ["<rootDir>/src"],
    testMatch: [`**/*.${platform}.test.ts?(x)`],
    moduleFileExtensions: platformExtensions(platform),
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js", "@ledgerhq/test-quarantine/jest-retries"],
    transform,
  };
}

module.exports = {
  projects: [
    {
      ...project("web"),
      moduleNameMapper: {
        "^@ledgerhq/lumen-ui-react$": "<rootDir>/__mocks__/@ledgerhq/lumen-ui-react.tsx",
      },
    },
    project("native"),
  ],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../../" }], "text"],
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
    "@ledgerhq/test-quarantine/jest",
  ],
};
