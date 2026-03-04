# Ledger Live Monorepo

This is the **ledger-live** monorepo — a pnpm + turborepo workspace containing:

- `apps/ledger-live-desktop` — Electron desktop wallet (React, TypeScript)
- `apps/ledger-live-mobile` — React Native mobile wallet (iOS/Android)
- `libs/` — shared libraries (`ledger-live-common`, `coin-modules`, etc.)

## Code Review Philosophy

- Flag only **clear violations** of the rules described in these instructions.
- Prefer **quality over quantity** — a few high-confidence comments are more valuable than many speculative ones.
- Focus on bugs, security issues, architecture violations, and missing tests before style nits.

## Test Coverage Requirements

Every PR that adds new functionality must include appropriate tests:
- New utility functions require unit tests.
- New hooks require hook tests.
- New features under `src/mvvm/` require integration tests in `__integrations__/`.
- Flag PRs adding helpers, utils, or hooks without corresponding test files.

## Changeset Requirement

Every PR that changes user-facing behavior or library APIs must include a changeset (`pnpm changeset`).

## Dependency Review

When a PR adds or updates dependencies in any `package.json`:
- The dependency must be justified (not duplicating an existing capability).
- Peer dependency compatibility must be verified.

## Lockfile Review

When a PR touches `pnpm-lock.yaml`, check that the diff is scoped to what the PR author changed.
Flag unrelated version bumps, large accidental rewrites, or duplicate entries.

## Coin-specific Logic

**Do not add coin-specific branches in generic UI.**
Flag PRs that introduce `if (family === "evm")` or similar in shared screens.
Coin-specific behavior must live in `families/` and be exposed through the families contract.

## Translations

Only add or edit English translation files:
- Desktop: `apps/ledger-live-desktop/static/i18n/en/app.json`
- Mobile: `apps/ledger-live-mobile/src/locales/en/common.json`
