const { createLibsCoinJestConfig } = require("@support/jest/libs-coin");

// near-api-js v7 depends on ESM-only @noble/@scure packages, which have to be transpiled for Jest.
const esmPackages = ["@noble", "@scure"];

const sharedConfig = {
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|tsx)$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
    [`node_modules/.pnpm/(${esmPackages.join("|")}).+\\.(js|mjs)?$`]: [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  transformIgnorePatterns: [`node_modules/.pnpm/(?!(${esmPackages.join("|")}))`],
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integration.test.ts", "\\.integ\\.test\\.ts$"],
};

// Two projects: `unit` runs with @ledgerhq/disable-network-setup (nock blocks all net connect),
// while `msw` runs the suites that exercise the real HTTP path via MSW WITHOUT it — nock and MSW
// both build on @mswjs/interceptors, so they cannot share the same run. Mirrors coin-kaspa/coin-mina.
module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  projects: [
    {
      ...sharedConfig,
      displayName: "unit",
      testMatch: ["**/*.unit.test.ts"],
      setupFilesAfterEnv: [
        "@ledgerhq/wallet-framework-test-setup",
        "@ledgerhq/disable-network-setup",
        "@ledgerhq/test-quarantine/jest-retries",
      ],
    },
    {
      ...sharedConfig,
      displayName: "msw",
      testMatch: ["**/*.test.ts"],
      testPathIgnorePatterns: [...sharedConfig.testPathIgnorePatterns, "\\.unit\\.test\\.ts$"],
      setupFilesAfterEnv: [
        "@ledgerhq/wallet-framework-test-setup",
        "@ledgerhq/test-quarantine/jest-retries",
      ],
    },
  ],
});
