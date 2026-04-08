<!-- Source: .cursor/agents/code-reviewer.md -->
<!-- Last synced: 2026-03-13 -->

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

## Privacy & Security — `@ledgerhq/client-ids`

Sensitive identifiers (DeviceId, UserId, DatadogId) must always use the `@ledgerhq/client-ids` library:

- **Never** use raw string IDs for devices, users, or analytics.
- **Always** use `DeviceId`, `UserId`, or `DatadogId` classes from `@ledgerhq/client-ids/ids`.
- ID values are only accessible through explicit export methods (e.g., `exportUserIdForSomething()`).
- Every export method must be allowlisted in `libs/client-ids/export-rules.json` with a justification.
- Export IDs only at system boundaries (API calls, persistence) — never in the middle of processing.
- `toString()` and `toJSON()` return `[DeviceId:REDACTED]` by default — this is by design.

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

If a PR changes the coin-framework interface (`libs/coin-framework/src/api/types.ts`), the author should also update the developer portal accordingly (repository: https://github.com/LedgerHQ/developer-portal).

## coin-modules

Each blockchain family lives in its own package under `libs/coin-modules/coin-<family>`. We should not create a new coin-module if it fits the ecosystem of an existing one. No packages other than coin-modules are allowed in this folder.

Package name: `@ledgerhq/coin-<family>`

### Module directory layout

Every coin module must follow this layout:

| Directory / file | Purpose |
|---|---|
| `api/` | Alpaca API surface — implements `AlpacaApi` from `@ledgerhq/coin-framework/api/types`, types from `@ledgerhq/types-live` are not allowed |
| `logic/` | Core blockchain logic, agnostic of Bridge or API interfaces; only depends on `network/` and external libs, not required if only implementing Alpaca API |
| `network/` | Communication with explorer / indexer / node |
| `types/` | Model definitions for the coin-module, not related to network |
| `bridge/` (legacy) | Bridge implementation (`CurrencyBridge` + `AccountBridge`), relates to types in  `@ledgerhq/types-live` package |
| `signer/` (legacy) | Hardware wallet signer interface and device address resolver |

- Unit tests: `*.unit.test.ts`, co-located with source.
- Integration tests without network calls: `*.test.ts`.
- Integration tests with real network calls: `*.integ.test.ts`, using separate `jest.integ.config.js`.

### Dependencies

Prefer native dependencies from the blockchain foundation/ecosystem and well-established open-source libraries. Avoid proprietary **third-party** SDKs or closed-source vendor packages (e.g. coin-vendor or exchange SDKs). This restriction does **not** apply to internal `@ledgerhq/*` workspace dependencies, which are allowed.

### Two integration paths

1. **Alpaca path** (preferred)— The coin module exports `createApi(config, currencyId)` implementing `AlpacaApi`. Families listed in the `alpacaized` map in `libs/ledger-live-common/src/bridge/impl.ts`, use `generic-alpaca` to build bridges from the API. Interface defined in `@ledgerhq/coin-framework/api/types.ts`.

Methods that are not applicable may raise a "not supported"/"not applicable" error.

2. **Classic JS Bridge** (legacy, should not be used) — The coin module exports `createBridges(signerContext, coinConfig)` returning `{ currencyBridge, accountBridge }`. This is wired via `libs/ledger-live-common/src/families/<family>/setup.ts`. Interface defined in `@ledgerhq/types-live`.

### Integ test requirements on Alpaca API

- `craftTransaction`, `estimateFees` integ tests need to cover each transaction type supported (token transfer, with memo, native transfer, delegation, ...).
- `getBalance`, `listOperations` integ tests need to cover each asset type possible in the coin-module (for tron it would be native asset (tron), trc10 tokens, trc20 tokens)
- `getBlockInfo`, `getBlock`, `listOperations`, `getStakes` integ tests need to compare against a reference block/operation/stake to validate metadata parsing.
- `getValidators` needs to validate metadata against a reference validator.
- `lastBlock` integ test needs to check that block height is higher than 0, time is a valid date and hash has the expected length.
- `getNextSequence` needs to check that it is higher than the current nonce for a specific account.


## Cross-team files (team-split convention)

When a PR touches a file or directory that is **owned by or relevant to multiple teams**, suggest refactoring to the **team-split convention**: splitting reduces friction between teams in CODEOWNERS by giving each team clear ownership of its files.

- Split into `[foo]/index.ts` and `[foo]/team-[team]/*.ts` (one file or small set per team; index re-exports all).
- For the full convention and examples, see **`.cursor/rules/team-split-convention.mdc`**. CODEOWNERS defines the allowed `team-*` slugs.

## Translations

Only add or edit translation files for the **English** language:

- Desktop: `apps/ledger-live-desktop/static/i18n/en/app.json`
- Mobile: `apps/ledger-live-mobile/src/locales/en/common.json`

## Jest Test Mocks

For test file changes, apply the rules in `.github/instructions/jest-mocks.instructions.md`.
