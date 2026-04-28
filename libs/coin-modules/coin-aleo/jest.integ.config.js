/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testRegex: ".integ.test.ts$",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  testTimeout: 60_000,
  forceExit: true,
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
        module: {
          type: "commonjs",
          // Keep dynamic import() as native so Node.js loads
          // ESM-only packages (e.g. @provablehq/sdk) without going
          // through Jest's require()-based module registry.
          ignoreDynamic: true,
        },
      },
    ],
  },
};
