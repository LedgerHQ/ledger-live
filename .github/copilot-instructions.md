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

- Never use raw string IDs for devices, users, or analytics — use `DeviceId`, `UserId`, or `DatadogId` from `@ledgerhq/client-ids/ids`.
- Export IDs only at system boundaries via allowlisted methods in `libs/client-ids/export-rules.json`.

## Dependency & Lockfile Review

- New dependencies must be justified and not duplicate existing capabilities.
- Lockfile diffs must be scoped to the PR's `package.json` changes — flag unrelated version bumps or large rewrites.

## Coin-specific Logic

- Never add `if (family === "...")` checks in generic UI — extend the families contract instead.
- Desktop: use `LLDCoinFamily` slots in `apps/ledger-live-desktop/src/renderer/families/types.ts`.
- Mobile: use optional slots or generated maps per family.

## Translations

- Only edit English translation files: `apps/ledger-live-desktop/static/i18n/en/app.json` or `apps/ledger-live-mobile/src/locales/en/common.json`.

## Performance

- Use `promiseAllBatched` from `libs/promise/src/promise.ts` instead of unbounded `Promise.all` for large arrays.
- Use `Set.has()` instead of `Array.includes()` for repeated lookups.
- Use `bigint` for Alpaca/API code and `BigNumber` for bridge code — never mix them.
- Prefer `subarray` over `slice` for Buffer operations when the original is not mutated.
- Avoid `useEffect` for derived state — compute during render or use `useMemo`.
- Use `@ledgerhq/logs` instead of `console.log` for production logging.
