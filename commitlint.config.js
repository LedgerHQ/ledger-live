const LEVEL_ERROR = 2;
const LEVEL_WARN = 1;

module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-empty": [LEVEL_ERROR, "never"],
  },
};
