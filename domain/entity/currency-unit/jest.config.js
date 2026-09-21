const { createDomainJestConfig } = require("@support/jest-domain");

module.exports = createDomainJestConfig({
  moduleNameMapper: { "^(\\.\\.?/.*)\\.js$": "$1" },
  testPathIgnorePatterns: ["lib/"],
});
