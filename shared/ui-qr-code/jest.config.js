const path = require("path");

const swcTransform = {
  "^.+\\.(t|j)sx?$": [
    "@swc/jest",
    { jsc: { target: "esnext", parser: { syntax: "typescript", tsx: true } } },
  ],
};

// Platform variants resolve like they do in the bundlers (Rspack `resolve.extensions`, Metro
// platform extensions): `import { QrCode } from "./QrCode"` picks `QrCode.native.tsx` on native
// and `QrCode.tsx` on web, so a suffix stays confined to the file that needs one.
const platformExtensions = platform => [
  `${platform}.tsx`,
  `${platform}.ts`,
  "tsx",
  "ts",
  "js",
  "jsx",
  "json",
];

const base = {
  testPathIgnorePatterns: ["lib/", "lib-es/", "node_modules/"],
  transform: swcTransform,
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../" }], "text"],
};

module.exports = {
  collectCoverage: true,
  coverageDirectory: "./coverage/",
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
  projects: [
    {
      ...base,
      displayName: "web",
      testEnvironment: "jsdom",
      moduleFileExtensions: platformExtensions("web"),
      testMatch: ["**/*.web.test.ts?(x)", "**/*.web.spec.ts?(x)"],
      setupFilesAfterEnv: ["@testing-library/jest-dom"],
    },
    {
      ...base,
      displayName: "native",
      testEnvironment: "node",
      moduleFileExtensions: platformExtensions("native"),
      testMatch: ["**/*.native.test.ts?(x)", "**/*.native.spec.ts?(x)"],
      moduleNameMapper: {
        // Stub react-native itself (Flow-typed ESM) so native tests run in a plain node env.
        // Mapped here (not via jest.mock) so it also intercepts react-native imports from inside
        // @testing-library/react-native.
        "^react-native$": path.join(__dirname, "jest/mocks/react-native.js"),
        "^@ledgerhq/lumen-ui-rnative(/.*)?$": path.join(
          __dirname,
          "jest/mocks/passthrough-native.js",
        ),
      },
    },
  ],
};
