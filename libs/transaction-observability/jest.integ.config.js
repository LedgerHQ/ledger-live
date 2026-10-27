const { createSharedJestConfig } = require("@support/jest/shared");

// Integration tests hit real services, so they are kept out of the unit run and dispatched
// deliberately. Mocking the network here would only prove a fixture matches itself.
module.exports = createSharedJestConfig(
  {
    rootDir: __dirname,
    testPathIgnorePatterns: ["lib/", "lib-es/"],
    testMatch: undefined,
    testRegex: "\\.integration\\.test\\.ts$",
  },
  // No retries: a retry that passes would hide a real service outage.
  { esm: true, retries: false },
);
