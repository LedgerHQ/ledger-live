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

Every PR that changes user-facing behavior or library APIs must include a changeset (`pnpm changeset`).

## Privacy & Security — `@ledgerhq/client-ids`

- **Never** use raw string IDs for devices, users, or analytics — use `DeviceId`, `UserId`, or `DatadogId` from `@ledgerhq/client-ids/ids`.
- Export IDs only at system boundaries via allowlisted methods in `libs/client-ids/export-rules.json`.

## Dependency Review

- New dependencies must be justified and not duplicate existing capabilities.
- Verify peer dependency compatibility.

## Lockfile Review

Flag `pnpm-lock.yaml` changes that include unrelated version bumps, large accidental rewrites, or entries not explained by the PR's `package.json` edits.

## Coin-specific Logic

**Never** add `if (family === "...")` branches in generic UI — coin-specific behavior must live in `families/` and be exposed through the families contract.

## Cross-team Files

When a PR touches files owned by multiple teams, suggest the **team-split convention**: split into `[foo]/index.ts` and `[foo]/team-[team]/*.ts`.

## Translations

Only edit English translation files: `apps/ledger-live-desktop/static/i18n/en/app.json` or `apps/ledger-live-mobile/src/locales/en/common.json`.
