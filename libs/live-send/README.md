# @ledgerhq/live-send

> [!CAUTION]
> **Status: UNSTABLE** — New package extracting send-flow helpers from `@ledgerhq/live-common`; API may change.

Shared send-flow logic used by Ledger Wallet Desktop and Mobile. It exists so new send helpers are not added to `@ledgerhq/live-common`, which is in maintenance mode.

Send descriptors (`sendFeatures`, `BalanceTypeConfig`, per-family configs) still live in `@ledgerhq/live-common` until that module is migrated. This package reads them; it does not own the coin contract.

## What it does

- `getSelectedBalanceTypeBalance(account, transaction)` — spendable balance of the pool a send draws from, for coins that hold several (e.g. Zcash transparent vs shielded). Returns `undefined` for single-balance coins, until the user picks a pool, or when the transaction still points at a pool the account no longer offers.

## Usage context

Imported by both apps on the send amount step and related headers so percentage-of-balance actions stay within the selected pool.
