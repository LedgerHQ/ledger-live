/**
 * Jest config for integration tests.
 *
 * Note: Ideally would extend ../../jest.config but the import resolution
 * is broken in this repo. This standalone config replicates the necessary settings.
 */
export default {
  rootDir: ".",
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.integ.test.ts"],
  testTimeout: 30000,
  testPathIgnorePatterns: ["/lib-es/", "/lib/"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
};
