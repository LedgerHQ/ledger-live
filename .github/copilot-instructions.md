<!-- Source: .cursor/rules/git-workflow.mdc, .cursor/rules/client-ids.mdc, .cursor/agents/code-reviewer.md -->
<!-- Last synced: 2026-02-13 -->

# Ledger Live Monorepo

This is the **ledger-live** monorepo — a pnpm + turborepo workspace containing:

- `apps/ledger-live-desktop` — Electron desktop wallet (React, TypeScript)
- `apps/ledger-live-mobile` — React Native mobile wallet (iOS/Android)
- `libs/` — shared libraries (`ledger-live-common`, `ledgerjs`, `client-ids`, `coin-modules`, etc.)

## Code Review Philosophy

- Flag only **clear violations** of the rules described in these instructions.
- Prefer **quality over quantity** — a few high-confidence comments are more valuable than many speculative ones.
- Focus on bugs, security issues, architecture violations, and missing tests before style nits.

## Changeset Requirement

Every PR that changes user-facing behavior or library APIs must include a changeset (`pnpm changeset`). Flag PRs that add features or fix bugs without one.

## Dependency Review

When a PR adds or updates dependencies in any `package.json`:

- The dependency must be justified (not duplicating an existing capability).
- Check the bundle size impact on [bundlephobia](https://bundlephobia.com).
- Peer dependency compatibility must be verified.

## Git Conventions

- **Branch prefixes**: `feat/`, `bugfix/`, `support/`, `chore` — kebab-case.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) — `<type>[scope]: <description>`.
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`.
- One commit = one logical change. Never mix refactor + fix + feature.

## Privacy & Security — `@ledgerhq/client-ids`

Sensitive identifiers (DeviceId, UserId, DatadogId) must always use the `@ledgerhq/client-ids` library:

- **Never** use raw string IDs for devices, users, or analytics.
- **Always** use `DeviceId`, `UserId`, or `DatadogId` classes from `@ledgerhq/client-ids/ids`.
- ID values are only accessible through explicit export methods (e.g., `exportUserIdForSomething()`).
- Every export method must be allowlisted in `libs/client-ids/export-rules.json` with a justification.
- Export IDs only at system boundaries (API calls, persistence) — never in the middle of processing.
- `toString()` and `toJSON()` return `[DeviceId:REDACTED]` by default — this is by design.

## Translations

Only add or edit translation files for the **English** language:

- Desktop: `apps/ledger-live-desktop/static/i18n/en/app.json`
- Mobile: `apps/ledger-live-mobile/src/locales/en/common.json`
