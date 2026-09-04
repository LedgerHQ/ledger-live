---
"@shared/schema-primitives": minor
"@ledgerhq/live-common": minor
"@domain/entity-account-balance": minor
"@features/platform-account-data": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/web-tools": minor
"@ledgerhq/wallet-cli": minor
---

Read an account's balance without a full account sync.

`@domain/entity-account-balance` holds a flat, serializable table of accounts and their token
accounts, plus the status of the last read, with its selectors declared in the slice (RTK 2).
`@features/platform-account-data` decides where a balance comes from: sources declare
`supports(ref)` and a priority, the highest-priority one that supports the account answers — a
single coin-module `getBalance` where the family allows it, today's `AccountBridge.sync()`
everywhere else, so the layer is never worse than what it replaces. Freshness and de-duplication
are two guards in `fetchAccountBalance`, reading the row's own `at` and the account's pending
status; there is no polling and no background loop, and `BridgeSync` keeps running beside the
layer rather than behind it.

Wired into Desktop, mobile, web-tools and wallet-cli. On web-tools the Synchronisation page reads a
balance without a full sync, and Ledger Sync resolves incoming account descriptors with a balance
read instead of a full `bridge.sync()` per descriptor. On wallet-cli `WalletAdapter`'s hardcoded
family set is replaced by source selection (narrowing kept explicit at `evm`, so the `balances`
output is unchanged), and the granular path becomes family-agnostic: it used to import
`createLocalEvmApi` / `evmBridge` directly, so it could only ever read EVM.

In live-common, `getAccountBalanceRows` (generic-coin-framework) is the shared granular read, and a
new `legacy-mapping` folder owns the `Account → AccountBalance[]` projection — the entity package
deliberately does not know what an `Account` is. The feature package splits its exports: `.` is
framework-free (source contract, thunk) and `./react` carries the hook, so a CLI can use the layer
without pulling React.

Documented in `docs/account-data-layer.md`, which states the purpose, how wallet-xp and ptx are
meant to consume it, where the duplication between the two sync worlds comes from, and the caveat
that a module's `getBalance` is only as cheap as the module makes it (coin-tron: one account-state
call; coin-evm: also has to discover which token contracts the address holds). Adds an Account
Balances devtool so the selection can be inspected per account from the app.
