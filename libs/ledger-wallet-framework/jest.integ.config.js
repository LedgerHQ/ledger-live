/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testRegex: ".integration.test.ts$",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  setupFilesAfterEnv: ["<rootDir>/jest-setup.js"],
  testTimeout: 90_000,
  forceExit: true,
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
