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
    "^@ledgerhq/lumen-ui-react/symbols$": "<rootDir>/jest/mocks/lumen-ui-react-symbols.tsx",
  },
  modulePaths: ["<rootDir>"],
  transformIgnorePatterns: [
    "node_modules/.pnpm/(?!(@ledgerhq\\+lumen-ui-react|@ledgerhq\\+lumen-design-core))",
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};
