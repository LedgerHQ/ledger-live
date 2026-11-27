# @domain/api-market-index-global

## 0.2.0-next.0

### Minor Changes

- [#25483](https://github.com/LedgerHQ/ledger-live/pull/25483) [`79d9979`](https://github.com/LedgerHQ/ledger-live/commit/79d99790d42b7a22d5d711f8029c3ecfced12fe0) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Migrate useGlobalMarketData to @domain/api-market-index-global and remove the live-common hook and its useMarketDataProvider re-export. Use `useGetGlobalMarketDataQuery` from `@domain/api-market-index-global` instead.

- [#25475](https://github.com/LedgerHQ/ledger-live/pull/25475) [`1860717`](https://github.com/LedgerHQ/ledger-live/commit/1860717a7e6b8017e927a5445e0cf16268aa2172) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the market-index-global domain packages (entity and Countervalues API endpoint)

### Patch Changes

- Updated dependencies [[`1860717`](https://github.com/LedgerHQ/ledger-live/commit/1860717a7e6b8017e927a5445e0cf16268aa2172), [`baf40c7`](https://github.com/LedgerHQ/ledger-live/commit/baf40c7721ae8525c7d99d48667a749d8de4e59a)]:
  - @domain/entity-market-index-global@0.2.0-next.0
  - @shared/api-services@0.14.0-next.0
