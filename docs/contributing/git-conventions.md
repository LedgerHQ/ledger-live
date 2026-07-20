# Git conventions

This is the canonical source for branch names, commit messages, pull request
titles and merge commits in this repository.

The goal is to make related Jira tickets, branches, pull requests and merge
commits easy to connect from the git history alone.

## Summary

```text
branch: <type>/<scope>-<ticket>-<short-description>
commit: <type>(<scope>): <description>
pr:     <type>(<scope>): <description> (<ticket>)
merge:  <pull request title>
```

The Jira ticket is optional. Include it when one exists.

## Types and scopes

Use Conventional Commit types for commit messages, pull request titles and branch
prefixes: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`,
`revert`, `style` and `test`.

Do not use the legacy `bugfix/` or `support/` branch prefixes. Use `fix/` for
bug fixes and `chore/` for maintenance or support work.

Scope identifies the main monorepo area affected by the change. The GitHub
labeler primarily assigns scope labels based on file changes; see
[`labeler.yml`](../../.github/labeler.yml) for the clearest link between affected
files and scope labels. Use lowercase kebab-case and prefer the existing app,
package or repository area name. Common scopes include `desktop`, `mobile`,
`common`, `ui`, `ledgerjs`, `coin-modules`, `shared-lib`, `cli`, `wallet-cli`,
`tools`, `automation`, `deps`, `release` and `docs`.

Use one primary scope. If a change spans several areas equally, use the closest
shared scope or omit the scope. Do not use ticket IDs as scopes:
`fix(LIVE-1234)` is not valid.

## Branch names

Use:

```text
<type>/<scope>[-<ticket>]-<short-description>
```

Examples:

```text
feat/desktop-LIVE-1234-add-dark-mode-toggle
fix/mobile-LIVE-2345-resolve-transaction-signing
chore/automation-LIVE-27608-update-git-guidelines
```

Without a Jira ticket:

```text
docs/common-update-api-documentation
```

Use kebab-case, keep branch names short and keep each branch focused on one
concern.

## Commit messages

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Rules:

- `scope` is optional but recommended.
- `description` is imperative, lowercase and has no trailing period.
- Keep the subject line at or below 72 characters when possible.
- Do not use gitmoji.
- Add a body for complex or user-facing changes.
- Add footers when needed, for example `BREAKING CHANGE: ...` or
  `Refs: LIVE-1234`.
- Keep commits small, isolated and meaningful.
- Never mix refactor, fix and feature work in a single commit.
- Do not use `--no-verify` when committing or pushing. Fix hook failures; if a
  hook is broken, surface it.

Examples:

```text
feat(desktop): add dark mode toggle
fix(mobile): resolve transaction signing issue
docs(common): update api documentation
```

Use `pnpm commit` to create a valid commit message, or
`pnpm commitlint --from <target-branch>` to check every commit on the branch.

## Pull request and merge titles

Pull request titles use the same Conventional Commit shape as commit messages,
with the Jira ticket at the end when one exists:

```text
feat(desktop): add dark mode toggle (LIVE-1234)
fix(coin-modules): correct bitcoin fee estimation (LIVE-2345)
chore(automation): harmonize git guidelines (LIVE-27608)
```

A GitHub workflow may automatically prepend a platform prefix based on PR labels:
`[LWD]` for Desktop-only changes, `[LWM]` for Mobile-only changes, or `[LWDM]`
for shared, common, coin-module or cross-platform changes. Leave that prefix in
place if automation adds it.

When creating a merge commit for a pull request, use the pull request title as
the merge commit title.
