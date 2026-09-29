# @shared/analytics

## 0.4.0-next.0

### Minor Changes

- [#22488](https://github.com/LedgerHQ/ledger-live/pull/22488) [`1302bc7`](https://github.com/LedgerHQ/ledger-live/commit/1302bc7968a7d3bf9cd3d556057b662444b22608) Thanks [@LL782](https://github.com/LL782)! - Replace mutable analytics screen refs with a function-only tracking-page API.

- [#22451](https://github.com/LedgerHQ/ledger-live/pull/22451) [`3fdfcc0`](https://github.com/LedgerHQ/ledger-live/commit/3fdfcc07ffb1d8e0b5ef39c830a5e7204ced77e3) Thanks [@LL782](https://github.com/LL782)! - Make `track` always return `Promise<void>` so callers can reliably await delivery

- [#22346](https://github.com/LedgerHQ/ledger-live/pull/22346) [`93e6db2`](https://github.com/LedgerHQ/ledger-live/commit/93e6db2db85721b483173e781db9f53db3699715) Thanks [@LL782](https://github.com/LL782)! - Allow "flushed" and "failed_identify" statuses in analytics events log

- [#22346](https://github.com/LedgerHQ/ledger-live/pull/22346) [`8a305ed`](https://github.com/LedgerHQ/ledger-live/commit/8a305edb307d0a4cd30ad615ccd98ef5d7caf523) Thanks [@LL782](https://github.com/LL782)! - Preserve route refs in preparation for enabling analytics. Still doesn't track without consent.

## 0.3.0

### Minor Changes

- [#22082](https://github.com/LedgerHQ/ledger-live/pull/22082) [`216ecb7`](https://github.com/LedgerHQ/ledger-live/commit/216ecb720b1f1937ae1a8c10ef40be24ea5d79cf) Thanks [@LL782](https://github.com/LL782)! - Export `publishAnalyticsEvent`, align `LoggableEvent` property names with existing analytics, and re-track `<TrackPage>` when page properties change.

## 0.3.0-next.0

### Minor Changes

- [#22082](https://github.com/LedgerHQ/ledger-live/pull/22082) [`216ecb7`](https://github.com/LedgerHQ/ledger-live/commit/216ecb720b1f1937ae1a8c10ef40be24ea5d79cf) Thanks [@LL782](https://github.com/LL782)! - Export `publishAnalyticsEvent`, align `LoggableEvent` property names with existing analytics, and re-track `<TrackPage>` when page properties change.

## 0.2.0

### Minor Changes

- [#21900](https://github.com/LedgerHQ/ledger-live/pull/21900) [`ae3fefb`](https://github.com/LedgerHQ/ledger-live/commit/ae3fefb0eda5aa487645423742ca7c747b5fb8e9) Thanks [@LL782](https://github.com/LL782)! - Add flush helpers for shared analytics clients.

- [#21822](https://github.com/LedgerHQ/ledger-live/pull/21822) [`37c5a9e`](https://github.com/LedgerHQ/ledger-live/commit/37c5a9e8584569572493d6774ba1403e5e88a5c7) Thanks [@LL782](https://github.com/LL782)! - Add first draft of `@shared/analytics` package.

- [#21893](https://github.com/LedgerHQ/ledger-live/pull/21893) [`92bf243`](https://github.com/LedgerHQ/ledger-live/commit/92bf243b6c59e3bf9e83a3eaa586da3ac20dee04) Thanks [@LL782](https://github.com/LL782)! - Add trackPage for shared page-view analytics.

## 0.2.0-next.0

### Minor Changes

- [#21900](https://github.com/LedgerHQ/ledger-live/pull/21900) [`ae3fefb`](https://github.com/LedgerHQ/ledger-live/commit/ae3fefb0eda5aa487645423742ca7c747b5fb8e9) Thanks [@LL782](https://github.com/LL782)! - Add flush helpers for shared analytics clients.

- [#21822](https://github.com/LedgerHQ/ledger-live/pull/21822) [`37c5a9e`](https://github.com/LedgerHQ/ledger-live/commit/37c5a9e8584569572493d6774ba1403e5e88a5c7) Thanks [@LL782](https://github.com/LL782)! - Add first draft of `@shared/analytics` package.

- [#21893](https://github.com/LedgerHQ/ledger-live/pull/21893) [`92bf243`](https://github.com/LedgerHQ/ledger-live/commit/92bf243b6c59e3bf9e83a3eaa586da3ac20dee04) Thanks [@LL782](https://github.com/LL782)! - Add trackPage for shared page-view analytics.
