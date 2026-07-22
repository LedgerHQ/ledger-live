# Git conventions

This is the canonical guidance for Git conventions in this repo.

The goal is for Git history to surface the **type** and **scope** of changes, and reference a related Jira ticket when possible.

## Summary

The structure below is based on [Conventional Commits](https://www.conventionalcommits.org/):

```text
branch:    <type>/<scope>-<ticket>-<short-description>
commit:    <type>(<scope>): <description>
PR title:  <type>(<scope>): <description> (<ticket>)
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

- `architecture`
- `ci`
- `coin-evm`
- `coin-modules`
- `desktop`
- `e2e`
- `portfolio`
- `swap`

Take values from the [scopes file](../../commitlint.scopes.js) – update when necessary.

Avoid multiple scopes, `desktop,mobile` is no longer valid. Find a single more informative value instead, e.g. `portfolio`

The value `unfocused` has been provided as a fallback but expect pushback if your PR does not have a clear scope.

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

Use `pnpm commit` to create a valid commit message, using tab-completion for type and scope.

Use `pnpm commitlint --from <target-branch>` to check every commit on the branch.

## Pull request and merge titles

e.g. `feat(ui): add dark mode toggle (LIVE-1234)`

Pull request titles use the same Conventional Commit shape as commit messages,
with the Jira ticket at the end when one exists.

A GitHub workflow may automatically prepend a platform prefix based on PR labels. Leave that prefix in place if automation adds it.

When creating a merge commit for a pull request, use the pull request title as the merge commit title.
