# @domain/entity-account-data

## 0.3.0-next.0

### Minor Changes

- [#23589](https://github.com/LedgerHQ/ledger-live/pull/23589) [`5b2d7d9`](https://github.com/LedgerHQ/ledger-live/commit/5b2d7d9b4369e56196c8c70889b701df7225da7a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add an Accounts section to DevTools with Account data, Descriptors and Balance pages

### Patch Changes

- Updated dependencies [[`fd6a3a3`](https://github.com/LedgerHQ/ledger-live/commit/fd6a3a341b07baa2849a9e79e3a05b73863034b7)]:
  - @domain/entity-account-descriptor@0.3.0-next.0

## 0.2.0

### Minor Changes

- [#23400](https://github.com/LedgerHQ/ledger-live/pull/23400) [`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): add the account data framework

  Kind registry and `accountData` status slice, source contract and router (ranking, batching, concurrency, pagination affinity), `fetchAccountData` / `fetchMoreAccountData` and the `useAccountData` hook. Both apps register the status slice and inject the router into the thunk `extraArgument`, with no source yet.

### Patch Changes

- Updated dependencies []:
  - @domain/entity-account-descriptor@0.2.1

## 0.2.0-next.0

### Minor Changes

- [#23400](https://github.com/LedgerHQ/ledger-live/pull/23400) [`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): add the account data framework

  Kind registry and `accountData` status slice, source contract and router (ranking, batching, concurrency, pagination affinity), `fetchAccountData` / `fetchMoreAccountData` and the `useAccountData` hook. Both apps register the status slice and inject the router into the thunk `extraArgument`, with no source yet.

### Patch Changes

- Updated dependencies []:
  - @domain/entity-account-descriptor@0.2.1-next.0
