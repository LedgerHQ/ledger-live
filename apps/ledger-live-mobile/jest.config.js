const { compilerOptions } = require("./tsconfig");

// Helper function to convert TypeScript paths to Jest moduleNameMapper
// This replaces pathsToModuleNameMapper from ts-jest which is not available in @swc/jest
function pathsToModuleNameMapper(paths, { prefix = "<rootDir>/" } = {}) {
  const jestPaths = {};
  if (!paths) return jestPaths;

  Object.keys(paths).forEach(pathKey => {
    // tsconfig uses "*": ["./*"] instead of baseUrl; mapping (.*) -> $1 breaks every module in Jest
    if (pathKey === "*") return;
    const pathValues = Array.isArray(paths[pathKey]) ? paths[pathKey] : [paths[pathKey]];
    pathValues.forEach(pathValue => {
      // Convert TypeScript path pattern to Jest regex pattern
      // Use /\*$/ for key (wildcard at end) but /\*/ for value (wildcard can be anywhere)
      const jestKey = pathKey.replace(/\*$/, "(.*)");
      const jestValue = pathValue.replace(/\*/g, "$1");
      jestPaths[jestKey] = `${prefix}${jestValue}`;
    });
  });

  return jestPaths;
}

const transformIncludePatterns = [
  "@react-native/polyfills",
  "(jest-)?react-native",
  "@react-native(-community)?",
  "@react-navigation",
  "react-native-worklets",
  "react-native-reanimated",
  "react-native-modal",
  "@hashgraph/sdk",
  "react-native-startup-time",
  "@segment/analytics-react-native",
  "uuid",
  "react-native-ble-plx",
  "react-native-android-location-services-dialog-box",
  "react-native-qrcode-svg",
  "react-native-video",
  "ky",
  "@gorhom/bottom-sheet",
  "react-native-safe-area-context",
  "react-native-gesture-handler",
  "@shopify/flash-list",
  "@ledgerhq/lumen-.*",
  "immer",
  "@features/.*",
  "@sbaiahmed1/react-native-blur",
  "@mysten",
  "@scure",
  "@noble",
  "d3-.*",
  "internmap",
];

/** @type {import('@swc/jest').JestConfigWithTsJest} */
module.exports = {
  /** CI sets `JEST_MAX_WORKERS` (e.g. `100%`); local default leaves laptops headroom. */
  maxWorkers: process.env.JEST_MAX_WORKERS || "50%",
  verbose: true,
  preset: "react-native",
  workerIdleMemoryLimit: "1GB",
  modulePaths: [compilerOptions.baseUrl ?? "."],
  setupFilesAfterEnv: [
    "./node_modules/react-native-gesture-handler/jestSetup.js",
    "./__tests__/jest-setup.js",
  ],
  testMatch: ["**/src/**/*.test.(ts|tsx)"],
  transform: {
    "^.+\\.(t)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
          transform: {
            react: {
              runtime: "automatic",
            },
          },
        },
      },
    ],
    "^.+\\.mjs$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  transformIgnorePatterns: [
    `node_modules/(?!(.pnpm|${transformIncludePatterns.join("|")})/)`,
    "\\.pnp\\.[^\\/]+$",
  ],
  testPathIgnorePatterns: ["<rootDir>/node_modules/"],
  moduleDirectories: ["node_modules"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
    "!src/**/__integration__/**",
    "!src/**/__integrations__/**",
    "!src/**/__tests__/**",
  ],
  coverageReporters: ["json", ["lcov", { projectRoot: "../" }], "json-summary"],
  reporters: [
    "default",
    ...(process.env.CI ? ["github-actions"] : []),
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
  resolver: "<rootDir>/scripts/resolver.js",
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths),
    "^@ledgerhq/lumen-ui-rnative$":
      "<rootDir>/node_modules/@ledgerhq/lumen-ui-rnative/src/index.ts",
    "^@ledgerhq/lumen-design-core$": "<rootDir>/node_modules/@ledgerhq/lumen-design-core",
    "^react$": "<rootDir>/node_modules/react",
    "^react/(.*)$": "<rootDir>/node_modules/react/$1",
    "^react-native/(.*)$": "<rootDir>/node_modules/react-native/$1",
    "^react-native$": "<rootDir>/node_modules/react-native",
    "^react-native-gesture-handler$": "<rootDir>/node_modules/react-native-gesture-handler",
    "^react-native-gesture-handler/(.*)$": "<rootDir>/node_modules/react-native-gesture-handler/$1",
    "styled-components":
      "<rootDir>/node_modules/styled-components/native/dist/styled-components.native.cjs.js",
    "^react-redux": "<rootDir>/node_modules/react-redux",
    "^@tanstack/react-query$": "<rootDir>/node_modules/@tanstack/react-query",
    // Redirect to mock for pre-compiled dependencies (like @ledgerhq/native-ui)
    "^react-native-worklets$": "<rootDir>/__mocks__/react-native-worklets.js",
    // Global mock for .lottie (dotLottie) files
    "\\.(lottie)$": "<rootDir>/__mocks__/lottieMock.js",
  },
};
