# Ledger Live Monorepo

This is the **ledger-live** monorepo — a pnpm + turborepo workspace containing:

- `apps/ledger-live-desktop` — Electron desktop wallet (React, TypeScript)
- `apps/ledger-live-mobile` — React Native mobile wallet (iOS/Android)
- `libs/` — shared libraries (`ledger-live-common`, `coin-modules`, etc.)

## Code Review Philosophy

- Flag only **clear violations** of the rules described in these instructions.
- Prefer **quality over quantity** — a few high-confidence comments are more valuable than many speculative ones.
- Focus on bugs, security issues, architecture violations, and missing tests before style nits.

## Changeset Requirement

Every PR that changes user-facing behavior or library APIs must include a changeset (`pnpm changeset`).
Flag PRs that add features or fix bugs without one.

## Test Coverage Requirement

Every PR that adds new features, hooks, or user-facing behavior must include corresponding tests.
Flag PRs that add new ViewModels, hooks, or UI flows without test coverage.
New analytics/tracking calls must have test assertions verifying the expected events and payloads.

## Dependency Review

When a PR adds or updates dependencies in any `package.json`:
- The dependency must be justified (not duplicating an existing capability).
- Peer dependency compatibility must be verified.

## Coin-specific Logic and Families Contract

**Do not add coin-specific branches in generic UI.**
Flag PRs that introduce `if (family === "evm")` or coin-specific hooks in shared screens/ViewModels.
Coin-specific behavior must live in **families/** and be exposed through the families contract.
When a flow needs new coin-specific behaviour, extend the contract (new optional slot) and implement it in the family folder.

## Translations

Only add or edit translation files for the **English** language:
- Desktop: `apps/ledger-live-desktop/static/i18n/en/app.json`
- Mobile: `apps/ledger-live-mobile/src/locales/en/common.json`
