---
name: git-workflow
description: Git workflow and commit conventions for Ledger Wallet
---

# Git Workflow & Commit Conventions

> The canonical lists of allowed **types** and **scopes** live in:
> - [`docs/git-conventions/commit-types.md`](../../../docs/git-conventions/commit-types.md)
> - [`docs/git-conventions/commit-scopes.md`](../../../docs/git-conventions/commit-scopes.md)
>
> Always refer to those files as the source of truth. This skill summarises the rules for quick reference.

## Branch Naming

Branches must use a clear prefix based on their purpose. The prefix must match the commit `type` of the primary change on that branch:

- **feat/** — New features
- **fix/** — Bug fixes
- **refactor/** — Refactoring
- **chore/** — Maintenance, tooling, configs, dependency updates
- **docs/** — Documentation only
- **test/** — Tests only
- **ci/** — CI/CD changes
- **perf/** — Performance improvements
- **revert/** — Reverts

### Format

```
<type>/<scope>-<short-description>
<type>/<ticket-id>-<short-description>
<type>/<scope>-<ticket-id>-<short-description>
```

### Examples

- `feat/lwm-add-ethereum-staking`
- `fix/LIVE-33220-lwd-globalsearch-testnets`
- `chore/update-dependencies`
- `ci/improve-allure-upload`

### Best Practices

- Use **kebab-case**
- Keep names **short, explicit, action-oriented**
- One branch = **one isolated concern**
- Do not use `support/` or `bugfix/` — these are legacy prefixes that have been retired

---

## Commit Message Format

Follow the **Conventional Commits** standard. Gitmoji is **not** used.

### Format

```
<type>[(<scope>)]: <description>

[optional body]

[optional footer(s)]
```

### Rules

- `type` must come from the [canonical type list](../../../docs/git-conventions/commit-types.md) — always lowercase
- `scope` is optional but strongly recommended; must come from the [canonical scope list](../../../docs/git-conventions/commit-scopes.md) — always lowercase kebab-case
- `description` must be **imperative, clear, lowercase**, max ~72 characters
- Do **not** use ticket IDs as scope (e.g. `fix(LIVE-123)` is wrong — put the ticket in the footer)
- Add body for complex or user-facing changes
- If needed, include footers:
  - `BREAKING CHANGE: ...`
  - Jira ticket reference (e.g. `Refs: LIVE-1234`)

### Examples

```
feat(lwm): add ethereum staking entry point
fix(lwd): hide feature-flag-disabled currencies from global search (LIVE-33220)
refactor(llc): simplify account syncing logic
test(coin-modules): add bitcoin integration tests
chore(deps): update pnpm lockfile
ci: only allure-formatted files reach allure server
```

---

## Workflow Best Practices

- Commits must be **small, isolated, meaningful**
- One commit = **one logical change**
- Prefer **multiple focused commits** over large mixed ones
- Never mix refactor + fix + feature in a single commit
- Rebase before PR to keep history clean
- Squash only for trivial branches
- **Never use `--no-verify` when committing or pushing** — pre-commit/pre-push hooks must run. If a hook fails, fix the underlying issue rather than skip it.
