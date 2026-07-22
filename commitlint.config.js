const scopes = require("./commitlint.scopes");

const LEVEL_ERROR = 2;
const LEVEL_WARN = 1;

module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [LEVEL_WARN, "always", scopes],
    "header-max-length": [LEVEL_ERROR, "always", 72],
  },
};
