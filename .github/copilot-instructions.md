<!-- Source: .cursor/agents/code-reviewer.md -->
<!-- Last synced: 2026-02-13 -->

# Ledger Live Monorepo

This is the **ledger-live** monorepo — a pnpm + turborepo workspace containing:

- `apps/ledger-live-desktop` — Electron desktop wallet (React, TypeScript)
- `apps/ledger-live-mobile` — React Native mobile wallet (iOS/Android)
- `libs/` — shared libraries (`ledger-live-common`, `client-ids`, `coin-modules`, etc.)

## Code Review Philosophy

- Flag only **clear violations** of the rules described in these instructions.
- Prefer **quality over quantity** — a few high-confidence comments are more valuable than many speculative ones.
- Focus on bugs, security issues, architecture violations, and missing tests before style nits.

## Changeset Requirement

Every PR that changes user-facing behavior or library APIs must include a changeset (`pnpm changeset`). Flag PRs that add features or fix bugs without one.

## Dependency Review

When a PR adds or updates dependencies in any `package.json`:

- The dependency must be justified (not duplicating an existing capability).
- Peer dependency compatibility must be verified.

## Lockfile (pnpm-lock.yaml) Review

When a PR touches `pnpm-lock.yaml`, check that the diff is **scoped to what the PR author actually changed** (e.g. the packages they added/updated in `package.json`). Flag the PR if the lockfile diff:

- **Unrelated version bumps** — Resolutions or versions of packages that were not added, removed, or updated in this PR’s `package.json` changes.
- **Large accidental rewrites** — Big reformatting, reordering, or mass version changes that go beyond the intended dependency change (e.g. running `pnpm install` in a different environment or with different pnpm/node).
- **Unwanted bundle or duplicate entries** — New lockfile entries (packages or versions) that don’t correspond to the PR’s stated dependency changes, or duplicate/conflicting entries that suggest lockfile corruption or merge issues.

If in doubt, the lockfile diff should be explainable by the set of `package.json` edits in the same PR; otherwise ask the author to regenerate the lockfile from a clean `pnpm install` and ensure only the intended dependency changes remain.

## Coin-specific logic and families contract

**Do not add coin-specific branches in generic UI.** Flag PRs that introduce `if (family === "evm")` (or similar) or coin-specific hooks in shared screens/ViewModels. Coin-specific behavior must live in **families/** and be exposed through the **families contract**:

- **Desktop:** Optional slots on `LLDCoinFamily` in `apps/ledger-live-desktop/src/renderer/families/types.ts`; families implement in `families/<family>/`; generic code uses `getLLDCoinFamily(currency.family).SlotName` only (no family-name checks).
- **Mobile:** Same idea: optional slots or generated maps (e.g. `NoAssociatedAccounts`), implemented per family; generic code looks up by contract, not by `family === "…"`.

When a flow needs new coin-specific behaviour, the fix is to **extend the contract** (new optional slot) and implement it in the family folder, not to add branching in generic code. This keeps the codebase ready for modularisation and lazy loading. See `.cursor/rules/coin-families-contract.mdc` for the full rule and the Scan Device “no associated accounts” example.

## Translations

Only add or edit translation files for the **English** language:

- Desktop: `apps/ledger-live-desktop/static/i18n/en/app.json`
- Mobile: `apps/ledger-live-mobile/src/locales/en/common.json`

## Jest Test Mocks

For test file changes, apply the rules in `.github/instructions/jest-mocks.instructions.md`.
