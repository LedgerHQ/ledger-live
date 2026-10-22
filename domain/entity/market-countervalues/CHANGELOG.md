# @domain/entity-market-countervalues

## 0.4.0

### Minor Changes

- [#23418](https://github.com/LedgerHQ/ledger-live/pull/23418) [`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be) Thanks [@ysitbon](https://github.com/ysitbon)! - Stop re-rendering every amount on a countervalues load that changes no rate

  A load now keeps a pair's rate Map and cache entry when every fetched value equals the stored one, and
  keeps the whole cache object when no pair changed. The conversions read the cache alone, through
  `useCountervaluesCache`, so a load that only stamps the fetch status no longer re-renders them. The
  conversions and the persisted export are the same as before.

- [#23211](https://github.com/LedgerHQ/ledger-live/pull/23211) [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a) Thanks [@ysitbon](https://github.com/ysitbon)! - Split the countervalues Redux slice by owner. The rates now have their own slice in `@domain/entity-market-countervalues` (`countervaluesRatesSlice`, with `setCountervaluesState` and `wipeCountervalues`), stored with a shallow freeze so a load never pays for a deep freeze of every rate. `@features/platform-market-countervalues` keeps the loop's state in `countervaluesSyncSlice` (`load`, `error`, `isPolling`; `load` is one of `idle`, `requested`, `loading`, `loadingThenRequested`, replacing the former `pending` and `triggerLoad` flags) and mounts both under the same `countervalues` store key through `countervaluesReducer`, typed `CountervaluesStoreState`, which replaces `CountervaluesState`. The store reads `countervalues.rates` and `countervalues.sync` instead of `countervalues.countervalues.state` and `countervalues.polling`; persistence and the saved data are unchanged. Each slice now declares its own actions, so the `COUNTERVALUES_*` type strings are gone: `setCountervaluesState` and `wipeCountervalues` keep their names, typed `countervaluesRates/set` and `countervaluesRates/wipe`, and the loop's setters `setCountervaluesPollingTriggerLoad`, `setCountervaluesStatePending`, `setCountervaluesStateError` and `setCountervaluesPollingIsPolling` become the events `countervaluesLoadRequested`, `countervaluesLoadStarted`, `countervaluesLoadSucceeded`, `countervaluesLoadFailed` and `countervaluesPollingSet`, typed `countervaluesSync/...`. A load start and a load failure now dispatch one action each instead of two. The sync selectors are the slice's own `selectors`, and `countervaluesSyncTriggerLoadSelector` is gone. `useCountervaluesPolling` now returns only the `poll`, `start`, `stop` and `wipe` commands and no longer re-renders its callers on every load; `pending` and `error` come from the new `useCountervaluesLoadStatus`, which live-common's `useSyncSources` now reads.

### Patch Changes

- Updated dependencies []:
  - @domain/entity-currency@0.4.7

## 0.4.0-next.0

### Minor Changes

- [#23418](https://github.com/LedgerHQ/ledger-live/pull/23418) [`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be) Thanks [@ysitbon](https://github.com/ysitbon)! - Stop re-rendering every amount on a countervalues load that changes no rate

  A load now keeps a pair's rate Map and cache entry when every fetched value equals the stored one, and
  keeps the whole cache object when no pair changed. The conversions read the cache alone, through
  `useCountervaluesCache`, so a load that only stamps the fetch status no longer re-renders them. The
  conversions and the persisted export are the same as before.

- [#23211](https://github.com/LedgerHQ/ledger-live/pull/23211) [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a) Thanks [@ysitbon](https://github.com/ysitbon)! - Split the countervalues Redux slice by owner. The rates now have their own slice in `@domain/entity-market-countervalues` (`countervaluesRatesSlice`, with `setCountervaluesState` and `wipeCountervalues`), stored with a shallow freeze so a load never pays for a deep freeze of every rate. `@features/platform-market-countervalues` keeps the loop's state in `countervaluesSyncSlice` (`load`, `error`, `isPolling`; `load` is one of `idle`, `requested`, `loading`, `loadingThenRequested`, replacing the former `pending` and `triggerLoad` flags) and mounts both under the same `countervalues` store key through `countervaluesReducer`, typed `CountervaluesStoreState`, which replaces `CountervaluesState`. The store reads `countervalues.rates` and `countervalues.sync` instead of `countervalues.countervalues.state` and `countervalues.polling`; persistence and the saved data are unchanged. Each slice now declares its own actions, so the `COUNTERVALUES_*` type strings are gone: `setCountervaluesState` and `wipeCountervalues` keep their names, typed `countervaluesRates/set` and `countervaluesRates/wipe`, and the loop's setters `setCountervaluesPollingTriggerLoad`, `setCountervaluesStatePending`, `setCountervaluesStateError` and `setCountervaluesPollingIsPolling` become the events `countervaluesLoadRequested`, `countervaluesLoadStarted`, `countervaluesLoadSucceeded`, `countervaluesLoadFailed` and `countervaluesPollingSet`, typed `countervaluesSync/...`. A load start and a load failure now dispatch one action each instead of two. The sync selectors are the slice's own `selectors`, and `countervaluesSyncTriggerLoadSelector` is gone. `useCountervaluesPolling` now returns only the `poll`, `start`, `stop` and `wipe` commands and no longer re-renders its callers on every load; `pending` and `error` come from the new `useCountervaluesLoadStatus`, which live-common's `useSyncSources` now reads.

### Patch Changes

- Updated dependencies []:
  - @domain/entity-currency@0.4.7-next.0

## 0.3.0

### Minor Changes

- [#22436](https://github.com/LedgerHQ/ledger-live/pull/22436) [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the countervalues domain api: rate fetching, and the orchestration that folds rates into the entity state.

  - `@domain/api-market-countervalues` owns the Countervalues Service endpoints and `loadCountervalues`, which moves out of `@ledgerhq/live-countervalues`.
  - The endpoints are injected into the shared countervalues api from `@shared/api-services` instead of standing up a second slice. The duplicate client in live-common is removed, so each app registers one countervalues reducer where it previously registered two against the same host. That slice is an RTK Query cache and is not persisted, so there is no stored state to migrate.
  - `loadCountervalues` takes its rates as an argument rather than reaching for a module-level client. The apps compose one in the countervalues bridge they already own; tests pass a mock directly, which removes the `MOCK_COUNTERVALUES` dispatcher hidden inside the fetch path.
  - Rate failures carry the HTTP status through unchanged, so an unsupported pair still clears its cache on 422, an HTTP failure still increments the per-pair backoff, and an offline period still does not.
  - Rate requests keep the previous request policy: a 60s timeout, so a hung connection can no longer stall countervalues polling, and the same retries as before. The two endpoints moved out of live-common keep not retrying.
  - `@ledgerhq/live-countervalues` drops `loadCountervalues`, its `api` entry point and the fetch contract types, and with them its dependencies on `@ledgerhq/logs`, `@ledgerhq/live-network`, `@ledgerhq/live-promise` and `@ledgerhq/live-env`. It no longer reaches the network.
  - web-tools now registers the shared countervalues api, which its portfolio countervalues loading dispatches through.
  - `cvsApiExtra` takes `getCountervaluesServiceUrl`, a getter read on every request, in place of the `countervaluesServiceUrl` string read once at store creation. Switching the developer staging toggle now applies to the next countervalues request again, as it did before the rates moved onto the shared api.

- [#23082](https://github.com/LedgerHQ/ledger-live/pull/23082) [`9ddaa97`](https://github.com/LedgerHQ/ledger-live/commit/9ddaa970d609f4b54f0cdbbda0609242cca54cf7) Thanks [@ysitbon](https://github.com/ysitbon)! - Make countervalues rate patches copy-on-write.

  - `applyRatePatches` no longer writes into the rate `Map`s it is given. A patched pair gets a new `Map`, the other pairs keep theirs, and the `data` and `cache` objects of `next` are left untouched.
  - `loadCountervalues` therefore leaves the state it loads from unchanged, so its result can be kept in a store that freezes its state (immer, behind `createSlice`) and passed back on the next poll. Before, the second poll on such a store threw and rates stopped updating.
  - The loaded state, the persisted export and the moment it is saved are unchanged.

- [#22786](https://github.com/LedgerHQ/ledger-live/pull/22786) [`e80d009`](https://github.com/LedgerHQ/ledger-live/commit/e80d009b57fbec125c43649fcc0b21edc60cb473) Thanks [@ysitbon](https://github.com/ysitbon)! - Docs and comments only: stop naming `@ledgerhq/live-countervalues`, which has been removed. READMEs and comments now point at `@domain/entity-market-countervalues`, or at live-common for `getPortfolio`. No code change.

- [#22383](https://github.com/LedgerHQ/ledger-live/pull/22383) [`33094bc`](https://github.com/LedgerHQ/ledger-live/commit/33094bc31d9d8cd7a80b8eae3cf2b4afe3afa500) Thanks [@ysitbon](https://github.com/ysitbon)! - Let wallet-pnl declare the countervalues interface it needs

  The package computed profit and loss straight against the countervalues implementation, which
  tied a pure pricing calculation to a concrete state shape. It now declares the three operations
  it uses as a `RateLookup` interface, treats the state as an opaque snapshot, and drops
  `@ledgerhq/live-countervalues` from its dependencies. The apps fill the interface at startup,
  beside the crypto-assets store and the two lookups already registered there.

  The exported signatures keep their arity and the state argument is assignable as before, so no
  caller needs a change for the interface.

  The third operation is a cache key. `getCostBasis` memoises against a fingerprint of the rate
  history relevant to a pair, which it used to compute inline from three countervalues helpers.
  That computation moves to `@domain/entity-market-countervalues` as `historyKey`, beside the
  `lenseRateMap` it is built on, so the three apps share one copy instead of each carrying its own
  and risking drift. A drifted key serves a stale cost basis silently. The key string is unchanged,
  and the existing cache tests pin it without being modified.

  The synthetic state builder moves with it. `buildCV`, `buildMultiCV` and `dailyHistory`
  construct countervalues state rather than reading it, so they cannot work against an opaque
  snapshot; they now live behind `@domain/entity-market-countervalues/mock`, and
  `@ledgerhq/wallet-pnl/scenarios` no longer exports them. The web-tools pnl-calculator imports them
  from the entity directly.

  web-tools registers the interface too. It renders profit and loss through the same package but
  was never a consumer of the two lookups registered previously, so it needed wiring of its own.

### Patch Changes

- Updated dependencies []:
  - @domain/entity-currency@0.4.6

## 0.3.0-next.0

### Minor Changes

- [#22436](https://github.com/LedgerHQ/ledger-live/pull/22436) [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the countervalues domain api: rate fetching, and the orchestration that folds rates into the entity state.

  - `@domain/api-market-countervalues` owns the Countervalues Service endpoints and `loadCountervalues`, which moves out of `@ledgerhq/live-countervalues`.
  - The endpoints are injected into the shared countervalues api from `@shared/api-services` instead of standing up a second slice. The duplicate client in live-common is removed, so each app registers one countervalues reducer where it previously registered two against the same host. That slice is an RTK Query cache and is not persisted, so there is no stored state to migrate.
  - `loadCountervalues` takes its rates as an argument rather than reaching for a module-level client. The apps compose one in the countervalues bridge they already own; tests pass a mock directly, which removes the `MOCK_COUNTERVALUES` dispatcher hidden inside the fetch path.
  - Rate failures carry the HTTP status through unchanged, so an unsupported pair still clears its cache on 422, an HTTP failure still increments the per-pair backoff, and an offline period still does not.
  - Rate requests keep the previous request policy: a 60s timeout, so a hung connection can no longer stall countervalues polling, and the same retries as before. The two endpoints moved out of live-common keep not retrying.
  - `@ledgerhq/live-countervalues` drops `loadCountervalues`, its `api` entry point and the fetch contract types, and with them its dependencies on `@ledgerhq/logs`, `@ledgerhq/live-network`, `@ledgerhq/live-promise` and `@ledgerhq/live-env`. It no longer reaches the network.
  - web-tools now registers the shared countervalues api, which its portfolio countervalues loading dispatches through.
  - `cvsApiExtra` takes `getCountervaluesServiceUrl`, a getter read on every request, in place of the `countervaluesServiceUrl` string read once at store creation. Switching the developer staging toggle now applies to the next countervalues request again, as it did before the rates moved onto the shared api.

- [#23082](https://github.com/LedgerHQ/ledger-live/pull/23082) [`9ddaa97`](https://github.com/LedgerHQ/ledger-live/commit/9ddaa970d609f4b54f0cdbbda0609242cca54cf7) Thanks [@ysitbon](https://github.com/ysitbon)! - Make countervalues rate patches copy-on-write.

  - `applyRatePatches` no longer writes into the rate `Map`s it is given. A patched pair gets a new `Map`, the other pairs keep theirs, and the `data` and `cache` objects of `next` are left untouched.
  - `loadCountervalues` therefore leaves the state it loads from unchanged, so its result can be kept in a store that freezes its state (immer, behind `createSlice`) and passed back on the next poll. Before, the second poll on such a store threw and rates stopped updating.
  - The loaded state, the persisted export and the moment it is saved are unchanged.

- [#22786](https://github.com/LedgerHQ/ledger-live/pull/22786) [`e80d009`](https://github.com/LedgerHQ/ledger-live/commit/e80d009b57fbec125c43649fcc0b21edc60cb473) Thanks [@ysitbon](https://github.com/ysitbon)! - Docs and comments only: stop naming `@ledgerhq/live-countervalues`, which has been removed. READMEs and comments now point at `@domain/entity-market-countervalues`, or at live-common for `getPortfolio`. No code change.

- [#22383](https://github.com/LedgerHQ/ledger-live/pull/22383) [`33094bc`](https://github.com/LedgerHQ/ledger-live/commit/33094bc31d9d8cd7a80b8eae3cf2b4afe3afa500) Thanks [@ysitbon](https://github.com/ysitbon)! - Let wallet-pnl declare the countervalues interface it needs

  The package computed profit and loss straight against the countervalues implementation, which
  tied a pure pricing calculation to a concrete state shape. It now declares the three operations
  it uses as a `RateLookup` interface, treats the state as an opaque snapshot, and drops
  `@ledgerhq/live-countervalues` from its dependencies. The apps fill the interface at startup,
  beside the crypto-assets store and the two lookups already registered there.

  The exported signatures keep their arity and the state argument is assignable as before, so no
  caller needs a change for the interface.

  The third operation is a cache key. `getCostBasis` memoises against a fingerprint of the rate
  history relevant to a pair, which it used to compute inline from three countervalues helpers.
  That computation moves to `@domain/entity-market-countervalues` as `historyKey`, beside the
  `lenseRateMap` it is built on, so the three apps share one copy instead of each carrying its own
  and risking drift. A drifted key serves a stale cost basis silently. The key string is unchanged,
  and the existing cache tests pin it without being modified.

  The synthetic state builder moves with it. `buildCV`, `buildMultiCV` and `dailyHistory`
  construct countervalues state rather than reading it, so they cannot work against an opaque
  snapshot; they now live behind `@domain/entity-market-countervalues/mock`, and
  `@ledgerhq/wallet-pnl/scenarios` no longer exports them. The web-tools pnl-calculator imports them
  from the entity directly.

  web-tools registers the interface too. It renders profit and loss through the same package but
  was never a consumer of the two lookups registered previously, so it needed wiring of its own.

### Patch Changes

- Updated dependencies []:
  - @domain/entity-currency@0.4.6-next.0

## 0.2.0

### Minor Changes

- [#22356](https://github.com/LedgerHQ/ledger-live/pull/22356) [`96d2bbf`](https://github.com/LedgerHQ/ledger-live/commit/96d2bbfee1cb1bf91c8afa653e4d4a79ba2b8951) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the countervalues domain entity: the rate state, and the pure logic over it.

  - `@domain/entity-market-countervalues` holds `CounterValuesState` and its serialized twin, the tracking pairs, the settings, and every computation that reads them: `calculate`, `calculateMany`, the rate lookups, `importCountervalues` / `exportCountervalues` and the pair resolution.
  - The shapes are Zod schemas with the types inferred from them, and currencies come from `@domain/entity-currency` rather than the legacy currency types.
  - Nothing consumes the package yet. `@ledgerhq/live-countervalues` keeps its own copy until it is turned into a shim over this one, so no behaviour changes.
  - `@domain/entity-market-countervalues/mock` carries the reference rate table the mock countervalues API derives its answers from.

### Patch Changes

- Updated dependencies []:
  - @domain/entity-currency@0.4.5

## 0.2.0-next.0

### Minor Changes

- [#22356](https://github.com/LedgerHQ/ledger-live/pull/22356) [`96d2bbf`](https://github.com/LedgerHQ/ledger-live/commit/96d2bbfee1cb1bf91c8afa653e4d4a79ba2b8951) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the countervalues domain entity: the rate state, and the pure logic over it.

  - `@domain/entity-market-countervalues` holds `CounterValuesState` and its serialized twin, the tracking pairs, the settings, and every computation that reads them: `calculate`, `calculateMany`, the rate lookups, `importCountervalues` / `exportCountervalues` and the pair resolution.
  - The shapes are Zod schemas with the types inferred from them, and currencies come from `@domain/entity-currency` rather than the legacy currency types.
  - Nothing consumes the package yet. `@ledgerhq/live-countervalues` keeps its own copy until it is turned into a shim over this one, so no behaviour changes.
  - `@domain/entity-market-countervalues/mock` carries the reference rate table the mock countervalues API derives its answers from.

### Patch Changes

- Updated dependencies []:
  - @domain/entity-currency@0.4.5-next.0
