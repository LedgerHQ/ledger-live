# Git conventions

This is the canonical guidance for Git conventions in this repo.

Our Git history should always surface the **type**, **scope** and description of changes, 
and when possible, link to a Jira ticket.

## Summary

The structure is required for **commit messages** and **PR titles** and optional for **branch names**.

Structure:

```text
commit message:  <type>(<scope>): <description>
PR title:        <type>(<scope>): <description> (<optional-ticket>)
branch name:     <type>/<scope>-<ticket>-<short-description>
```

Valid examples:

```text
commit message:  feat(ui): add dark mode toggle
PR title:        feat(ui): add dark mode toggle
PR title:        feat(ui): add dark mode toggle (LIVE-1234)
branch name:     feat/ui-LIVE-1234-add-dark-mode-toggle
```

Invalid examples:

```text
commit message:  feat: add dark mode toggle
PR title:        feat: add dark mode toggle (LIVE-1234)
```

## Type

Types are listed in [commitlint.types.js](../../commitlint.types.js):

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

Do not use the legacy `bugfix` or `support`. Use `fix` for bug fixes and `chore` for maintenance or support work.

## Scope

Scopes give context around the changes. They name the concern, domain or feature related to the work.

Examples:

- `architecture`
- `coin-evm`
- `counter-values`
- `e2e`
- `portfolio`
- `swap`

Avoid multiple scopes – prefer a single more informative value, e.g. use `portfolio` rather than `desktop,mobile`.

Avoid broad scopes – prefer specifics, e.g. use `coin-modules` instead of `shared`.

Do not use ticket IDs as scope: `fix(LIVE-1234)` is not a valid scope.

## Tickets

Internal contributions should be related to a Jira ticket. If a ticket does not exist you should create one. If you are making an open source contribution, create a Github issue instead.

## Description

A short description of the changes. This should add to the information provided by type and scope.

## Branch names (optional guidance)

e.g. `feat/ui-LIVE-1234-add-dark-mode-toggle`

Use kebab-case, keep branch names short and keep each branch focused on one concern.

_Rules are not enforced on branch names. Following this structure is entirely optional._

## Commit messages

e.g. `feat(ui): add dark mode toggle`

Rules:

- `type` and `scope` are required.
- `description` is imperative, lowercase and has no trailing period.
- Keep the subject line at or below 72 characters.
- Do not use gitmoji.
- Keep commits small, isolated and meaningful.
- Never mix refactor, fix and feature work in a single commit.
- Do not use `--no-verify` when committing or pushing. Fix hook failures; if a hook is broken, surface it.

Use `pnpm commit` to create a valid commit message, using tab-completion for type.

Use `pnpm commitlint --from <target-branch>` to check every commit on the branch.

## Pull request titles

e.g. `feat(ui): add dark mode toggle (LIVE-1234)`

Pull request titles use the same structure as commit messages, with the option of a Jira ticket at the end.

A GitHub workflow may automatically prepend a platform prefix based on PR labels, e.g. "LWD" or "LWM". 
Leave that prefix in place if automation adds it.

When creating a merge commit for a pull request, use a valid pull request title as the merge commit title.
