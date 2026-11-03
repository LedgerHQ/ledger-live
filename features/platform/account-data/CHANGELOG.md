# @features/platform-account-data

## 0.3.0-next.0

### Minor Changes

- [#24185](https://github.com/LedgerHQ/ledger-live/pull/24185) [`304b8b2`](https://github.com/LedgerHQ/ledger-live/commit/304b8b2575f6adfa895b50b6697febd1ccab7e7e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Store account data status and the operations windows per query, and keep the newest copy of an operation shared by several queries

### Patch Changes

- Updated dependencies [[`304b8b2`](https://github.com/LedgerHQ/ledger-live/commit/304b8b2575f6adfa895b50b6697febd1ccab7e7e), [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820)]:
  - @domain/entity-account-data@0.4.0-next.0
  - @domain/api-account-data@0.4.0-next.0
  - @domain/entity-account-descriptor@0.4.0-next.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`20102d3`](https://github.com/LedgerHQ/ledger-live/commit/20102d3d6f99cdfa8e8e14f9c3b86f960adef64c), [`f51f724`](https://github.com/LedgerHQ/ledger-live/commit/f51f72470d118331f3c3219ed28f13039df309cb), [`fd6a3a3`](https://github.com/LedgerHQ/ledger-live/commit/fd6a3a341b07baa2849a9e79e3a05b73863034b7), [`5b2d7d9`](https://github.com/LedgerHQ/ledger-live/commit/5b2d7d9b4369e56196c8c70889b701df7225da7a), [`2dc1bee`](https://github.com/LedgerHQ/ledger-live/commit/2dc1beef8479530302204a9563b541ba9f7dbc2c)]:
  - @domain/api-account-data@0.3.0
  - @domain/entity-account-descriptor@0.3.0
  - @domain/entity-account-data@0.3.0

## 0.2.1-next.0

### Patch Changes

- Updated dependencies [[`20102d3`](https://github.com/LedgerHQ/ledger-live/commit/20102d3d6f99cdfa8e8e14f9c3b86f960adef64c), [`f51f724`](https://github.com/LedgerHQ/ledger-live/commit/f51f72470d118331f3c3219ed28f13039df309cb), [`fd6a3a3`](https://github.com/LedgerHQ/ledger-live/commit/fd6a3a341b07baa2849a9e79e3a05b73863034b7), [`5b2d7d9`](https://github.com/LedgerHQ/ledger-live/commit/5b2d7d9b4369e56196c8c70889b701df7225da7a), [`2dc1bee`](https://github.com/LedgerHQ/ledger-live/commit/2dc1beef8479530302204a9563b541ba9f7dbc2c)]:
  - @domain/api-account-data@0.3.0-next.0
  - @domain/entity-account-descriptor@0.3.0-next.0
  - @domain/entity-account-data@0.3.0-next.0

## 0.2.0

### Minor Changes

- [#23400](https://github.com/LedgerHQ/ledger-live/pull/23400) [`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): add the account data framework

  Kind registry and `accountData` status slice, source contract and router (ranking, batching, concurrency, pagination affinity), `fetchAccountData` / `fetchMoreAccountData` and the `useAccountData` hook. Both apps register the status slice and inject the router into the thunk `extraArgument`, with no source yet.

### Patch Changes

- Updated dependencies [[`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c)]:
  - @domain/entity-account-data@0.2.0
  - @domain/api-account-data@0.2.0
  - @domain/entity-account-descriptor@0.2.1

## 0.2.0-next.0

### Minor Changes

- [#23400](https://github.com/LedgerHQ/ledger-live/pull/23400) [`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): add the account data framework

  Kind registry and `accountData` status slice, source contract and router (ranking, batching, concurrency, pagination affinity), `fetchAccountData` / `fetchMoreAccountData` and the `useAccountData` hook. Both apps register the status slice and inject the router into the thunk `extraArgument`, with no source yet.

### Patch Changes

- Updated dependencies [[`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c)]:
  - @domain/entity-account-data@0.2.0-next.0
  - @domain/api-account-data@0.2.0-next.0
  - @domain/entity-account-descriptor@0.2.1-next.0
