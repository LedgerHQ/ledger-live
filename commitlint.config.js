const { COMMIT_TYPES } = require("./commitlint.types.js");

const LEVEL_ERROR = 2;
const LEVEL_WARN = 1;

module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-max-length": [LEVEL_ERROR, "always", 72],
    "scope-empty": [LEVEL_ERROR, "never"],
    "type-enum": [LEVEL_ERROR, "always", COMMIT_TYPES],
  },
};
