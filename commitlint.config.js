const scopes = require("./commitlint.scopes");

module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2, // level: error
      "always",
      scopes,
    ],
  },
};
