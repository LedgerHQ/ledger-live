---
"@shared/schema-primitives": minor
"@ledgerhq/live-common": minor
"@domain/entity-account-balance": minor
"@features/platform-account-data": minor
"ledger-live-desktop": minor
"@ledgerhq/web-tools": minor
"@ledgerhq/wallet-cli": minor
---

Add the `balance` account slice and the hybrid data-source layer behind it: `@domain/entity-account-balance` (flat, serializable balance table for accounts and their token accounts) and `@features/platform-account-data` (capability-routed `AccountDataSource` port, set-cover router, freshness/coalescing scheduler, granular coin-module and legacy-bridge sources, `useAccountBalance`). Wired into Desktop, where balances are mirrored from the legacy account store and a granular chain read serves families that declare it. Wired into web-tools too: the Synchronisation page reads a balance without a full sync, and Ledger Sync resolves incoming account descriptors with a `{ balance }` request instead of a full `bridge.sync()` per descriptor. And into wallet-cli, where `WalletAdapter`'s hardcoded `coinFrameworkFamilies` set is replaced by the router. The granular read itself moves to `getAccountBalanceRows` in live-common's `generic-coin-framework`, shared by all three composition roots — which also makes wallet-cli's granular path family-agnostic: it used to import `createLocalEvmApi` / `evmBridge` directly, so it could only ever read EVM. The package now splits its exports: `.` is framework-free (port, router, registry, scheduler, sources) and `./react` carries the provider and hooks, so a CLI can use the layer without pulling React. Documented in `docs/account-data-layer.md`, including the caveat that a module's `getBalance` is only as cheap as the module makes it (coin-tron: one account-state call; coin-evm: walks the whole tx history for token discovery).
