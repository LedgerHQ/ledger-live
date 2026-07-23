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

We will enforce this struture for commit messages and PR titles (which will be used for merge commits).
This makes it easier to extract reliable data from Git history.

Consistent naming of branches is entirely optional as these do not remain in Git History.

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

Scopes give context around the changes. They name the related concern, domain or feature related to the work.

Examples:

- `architecture`
- `coin-evm`
- `counter-values`
- `e2e`
- `portfolio`
- `swap`

Avoid multiple scopes – prefer a single more informative value, e.g. use `portfolio` rather than `desktop,mobile`.

Avoid broad scopes – prefer specifics, e.g. use `coin-modules` instead of `shared`.

Do not use ticket IDs as scope: `fix(LIVE-1234)` is not a valid scope. Use in the PR title instead.

## Tickets

Internal contributions should be related to a Jira ticket. If a ticket does not exist you should create one. If you are making an open source contribution, create a Github issue instead.

## Description

A short description of the changes. This should add to the information provided by type and scope.

## Branch names

e.g. `feat/ui-LIVE-1234-add-dark-mode-toggle`

Use kebab-case, keep branch names short and keep each branch focused on one concern.

Rules are not enforced on branch names. Following this structure is entirely optional.

## Commit messages

e.g. `feat(ui): add dark mode toggle`

Rules:

- `type` and `scope` are required – see guidelines above
- `description` is imperative, lowercase and has no trailing period.
- Keep the subject line at or below 72 characters.
- Do not use gitmoji.
- Keep commits small, isolated and meaningful.
- Never mix refactor, fix and feature work in a single commit.
- Do not use `--no-verify` when committing or pushing. Fix hook failures; if a hook is broken, surface it.

Use `pnpm commit` to create a valid commit message, using tab-completion for type and scope.

Use `pnpm commitlint --from <target-branch>` to check every commit on the branch.

## Pull request and merge titles

e.g. `feat(ui): add dark mode toggle (LIVE-1234)`

Pull request titles use the same Conventional Commit shape as commit messages, with the Jira ticket at the end when one exists.

A GitHub workflow may automatically prepend a platform prefix based on PR labels, e.g. "LWD" or "LWM". Leave that prefix in place if automation adds it.

When creating a merge commit for a pull request, use the pull request title as the merge commit title.
