const scopes = require("./commitlint.scopes");

const LEVEL_ERROR = 2;
const LEVEL_WARN = 1;

module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-max-length": [LEVEL_ERROR, "always", 72],
    "scope-enum": [LEVEL_WARN, "always", scopes],
    "scope-delimiter-style": [LEVEL_ERROR, "always", ","],
  },
};
