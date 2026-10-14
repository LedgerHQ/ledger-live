// near-api-js v7 depends on ESM-only @noble/@scure packages, which have to be transpiled for Jest.
const esmPackages = ["@noble", "@scure"];

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup"],
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
      },
    ],
  },
  transformIgnorePatterns: [`node_modules/.pnpm/(?!(${esmPackages.join("|")}))`],
};
