module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.(t|j)sx?$": [
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
  },
  moduleFileExtensions: ["web.tsx", "web.ts", "tsx", "ts", "js", "jsx", "json", "node"],
  testPathIgnorePatterns: ["\\.native\\.test\\."],
  moduleNameMapper: {
    "^@ledgerhq/lumen-ui-react$": "<rootDir>/jest/mocks/lumen-ui-react.tsx",
    "^@ledgerhq/lumen-ui-react/symbols$": "<rootDir>/jest/mocks/lumen-ui-react-symbols.tsx",
    "^@ledgerhq/lumen-design-core$": "<rootDir>/jest/mocks/lumen-design-core.ts",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};
