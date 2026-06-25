/**
 * Commitlint configuration.
 *
 * The canonical list of allowed types and scopes lives in:
 *   docs/git-conventions/commit-types.md
 *   docs/git-conventions/commit-scopes.md
 *
 * Keep the type-enum rule below in sync with commit-types.md.
 *
 * Reference: https://ledgerhq.atlassian.net/browse/LIVE-27608
 */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "build",
        "chore",
        "ci",
        "docs",
        "feat",
        "fix",
        "perf",
        "refactor",
        "revert",
        "style",
        "test",
      ],
    ],
  },
};
