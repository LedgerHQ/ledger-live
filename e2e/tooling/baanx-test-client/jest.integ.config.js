/**
 * Live integration tests. Requires real credentials in the environment; see
 * src/user.integ.test.ts. Kept separate from jest.config.js so `pnpm test`
 * stays hermetic.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testRegex: ".integ.test.ts$",
  testTimeout: 60_000,
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
