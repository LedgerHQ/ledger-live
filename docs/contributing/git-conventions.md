# Git conventions

This is the canonical guidance for Git conventions in this repo.

The goal is for Git history to surface the **type** and **scope** of changes, and reference a related Jira ticket when possible.

## Summary

The structure below is based on [Conventional Commits](https://www.conventionalcommits.org/):

```text
branch:    <type>/<scope>-<ticket>-<short-description>
commit:    <type>(<scope>): <description>
pr title:  <type>(<scope>): <description> (<ticket>)
```

e.g.

```text
branch: feat/ui-LIVE-1234-add-dark-mode-toggle
commit: feat(ui): add dark mode toggle
PR title: feat(ui): add dark mode toggle (LIVE-1234)
```

We will enforce this for commit messages and PR titles (which will be used for merge commits). This allows tools to extract reliable data from Git history. Consistent naming of branches is entirely optional.

## Type

Types come from Conventional Commit types:

- `build`
- `chore`
- `ci`
- `docs`
- `feat`
- `fix`
- `perf`
- `refactor`
- `revert`
- `style`
- `test`

Do not use the legacy `bugfix/` or `support/` branch prefixes. Use `fix/` for bug fixes and `chore/` for maintenance or support work.

## Scope

Scopes give context around the changes. They name the related app, feature or intention behind the work.

Examples:

- `ci`
- `cli`
- `coin-evm`
- `coin-modules`
- `ddd`
- `desktop`
- `e2e`
- `mobile`
- `swap`

Take values from the [scopes file](../../commitlint.scopes.js) – update when necessary.

Multiple scopes can be comma separated `desktop,mobile` but it is better to find a single value that gives more information, e.g. `portfolio`

The value `unfocused` has been provided as a fallback but it should only be used as a last resort.

Do not use ticket IDs as scopes: `fix(LIVE-1234)` is not valid.

## Ticket

The Jira ticket is optional. Include it when one exists.

## Description

A short description of the change adding to the scope and type.

## Branch names

e.g. `feat/ui-LIVE-1234-add-dark-mode-toggle`

Use kebab-case, keep branch names short and keep each branch focused on one concern.

Rules are not enforced. Following the structure is entirely optional.

## Commit messages

e.g. `feat(ui): add dark mode toggle`

Rules:

- `type` and `scope` are imperative – see guidelines above
- `description` is imperative, lowercase and has no trailing period.
- Keep the subject line at or below 72 characters when possible.
- Do not use gitmoji.
- Keep commits small, isolated and meaningful.
- Never mix refactor, fix and feature work in a single commit.
- Do not use `--no-verify` when committing or pushing. Fix hook failures; if a hook is broken, surface it.

Use `pnpm commit` to create a valid commit message, or
`pnpm commitlint --from <target-branch>` to check every commit on the branch.

## Pull request and merge titles

e.g. `feat(ui): add dark mode toggle (LIVE-1234)`

Pull request titles use the same Conventional Commit shape as commit messages,
with the Jira ticket at the end when one exists.

A GitHub workflow may automatically prepend a platform prefix based on PR labels. Leave that prefix in place if automation adds it.

When creating a merge commit for a pull request, use the pull request title as the merge commit title.
