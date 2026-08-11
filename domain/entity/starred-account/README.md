# @domain/entity-starred-account

> **Status: UNSTABLE** — This package is incrementally shipping the validated WalletSync DDD architecture; API may change.

> **⚠️ DEPRECATED** — The Wallet V4 implementation no longer uses the concept of starred accounts. This package is introduced for backwards compatibility and will not be actively developed further. Do not build new features on top of it.

RTK slice for starred (pinned) accounts.

State shape: `Set<string>` (the slice state IS the Set directly). Local-only state (not synced). Exports `starredAccountsSlice`, actions (`setAccountStarred`, `initStarredFromIds`) and selector `isStarredAccountSelector`.

## Related documentation

- [App integration](../../../docs/ledger-sync/07-app-integration.md) — wallet Redux wiring in Desktop & Mobile
