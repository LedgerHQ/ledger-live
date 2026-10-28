# @domain/api-account-data

## 0.3.0-next.0

### Minor Changes

- [#23893](https://github.com/LedgerHQ/ledger-live/pull/23893) [`20102d3`](https://github.com/LedgerHQ/ledger-live/commit/20102d3d6f99cdfa8e8e14f9c3b86f960adef64c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add source purposes, `router.addSource` and the `addAccountDataSource` thunk to add account data sources at runtime

- [#23960](https://github.com/LedgerHQ/ledger-live/pull/23960) [`f51f724`](https://github.com/LedgerHQ/ledger-live/commit/f51f72470d118331f3c3219ed28f13039df309cb) Thanks [@gre-ledger](https://github.com/gre-ledger)! - A source rejects an account with `AccountDataNotServedError` to hand it to the next ranked source

- [#23959](https://github.com/LedgerHQ/ledger-live/pull/23959) [`2dc1bee`](https://github.com/LedgerHQ/ledger-live/commit/2dc1beef8479530302204a9563b541ba9f7dbc2c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - `addSource` and `addAccountDataSource` take `{ first: true }` to rank a runtime source ahead of the app's

### Patch Changes

- Updated dependencies [[`fd6a3a3`](https://github.com/LedgerHQ/ledger-live/commit/fd6a3a341b07baa2849a9e79e3a05b73863034b7), [`5b2d7d9`](https://github.com/LedgerHQ/ledger-live/commit/5b2d7d9b4369e56196c8c70889b701df7225da7a)]:
  - @domain/entity-account-descriptor@0.3.0-next.0
  - @domain/entity-account-data@0.3.0-next.0

## 0.2.0

### Minor Changes

- [#23400](https://github.com/LedgerHQ/ledger-live/pull/23400) [`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): add the account data framework

  Kind registry and `accountData` status slice, source contract and router (ranking, batching, concurrency, pagination affinity), `fetchAccountData` / `fetchMoreAccountData` and the `useAccountData` hook. Both apps register the status slice and inject the router into the thunk `extraArgument`, with no source yet.

### Patch Changes

- Updated dependencies [[`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c)]:
  - @domain/entity-account-data@0.2.0
  - @domain/entity-account-descriptor@0.2.1

## 0.2.0-next.0

### Minor Changes

- [#23400](https://github.com/LedgerHQ/ledger-live/pull/23400) [`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): add the account data framework

  Kind registry and `accountData` status slice, source contract and router (ranking, batching, concurrency, pagination affinity), `fetchAccountData` / `fetchMoreAccountData` and the `useAccountData` hook. Both apps register the status slice and inject the router into the thunk `extraArgument`, with no source yet.

### Patch Changes

- Updated dependencies [[`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c)]:
  - @domain/entity-account-data@0.2.0-next.0
  - @domain/entity-account-descriptor@0.2.1-next.0
