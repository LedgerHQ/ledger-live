# @domain/entity-starred-account

RTK slice for starred (pinned) accounts.

State shape: `starredAccountIds: Set<string>`. Local-only state (not synced). Exports `starredAccountsSlice`, actions (`setAccountStarred`, `initStarredFromIds`) and selector `isStarredAccountSelector`.

## Related documentation

- [App integration](./../../docs/ledger-sync/07-app-integration.md) — wallet Redux wiring in Desktop & Mobile
