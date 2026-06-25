# Commit Types — Canonical Enum

> Single source of truth for the `type` field in commit messages, PR titles, and branch prefixes.
>
> **Reference:** [ADR — Harmonize type and scope across pull request titles and GitHub labels](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7266992139)  
> **Ticket:** [LIVE-27608](https://ledgerhq.atlassian.net/browse/LIVE-27608)

---

## Allowed types

| Type | When to use |
|------|-------------|
| `feat` | A new feature or user-facing capability |
| `fix` | A bug fix |
| `refactor` | Code restructuring that neither adds a feature nor fixes a bug |
| `perf` | A change that improves performance |
| `test` | Adding or updating tests only |
| `docs` | Documentation changes only |
| `chore` | Maintenance, tooling, dependency updates, configs — anything that does not touch production code or tests |
| `ci` | Changes to CI/CD configuration files and scripts |
| `build` | Changes affecting the build system or external dependencies (e.g. webpack, turbo, pnpm) |
| `revert` | Reverts a previous commit |
| `style` | Formatting, whitespace, missing semicolons — no logic change |

---

## Notes

- This list is intentionally aligned with [@commitlint/config-conventional](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional), which is what `commitlint.config.js` extends.
- **`support/`** was previously used as a branch prefix for miscellaneous changes. It is replaced by `chore/` for branch naming (see [commit-scopes.md](./commit-scopes.md)). It must not appear in commit message types or PR titles.
- **`bugfix/`** was previously used as a branch prefix. It is replaced by `fix/`. It must not appear in commit message types or PR titles.
- Types are **always lowercase**.
- The `type-enum` rule in `commitlint.config.js` must be kept in sync with this file. If you need to add or remove a type, update both.
