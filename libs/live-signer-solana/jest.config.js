module.exports = {
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  // live-dmk-shared is consumed from its TS source (as the apps do); mapping only
  // that package keeps every other workspace dependency on its built output, so
  // module spies in the legacy signer tests keep working.
  moduleNameMapper: {
    "^@ledgerhq/live-dmk-shared$": "<rootDir>/../live-dmk-shared/src/index.ts",
  },
  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.js",
    "@ledgerhq/disable-network-setup",
    "@ledgerhq/test-quarantine/jest-retries",
  ],
  transform: {
    "^.+\\.(ts|tsx)?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  reporters: [
    "default",
    ...(process.env.CI ? ["github-actions"] : []),
    "@ledgerhq/test-quarantine/jest",
  ],
};
