// Integration tests hit real services, so they are kept out of the unit run and dispatched
// deliberately. Mocking the network here would only prove a fixture matches itself.
module.exports = {
  ...require("./jest.config"),
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  testRegex: "\\.integration\\.test\\.ts$",
};
