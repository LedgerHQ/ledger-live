/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testRegex: ".integ.test.ts$",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  /** Long integ tests (onboarding + party polling) need headroom; avoids racing the poll helper. */
  testTimeout: 120_000,
  /** Serial runs reduce shared devnet contention across multiple *.integ.test.ts files. */
  maxWorkers: 1,
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
