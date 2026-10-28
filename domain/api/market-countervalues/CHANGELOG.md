# @domain/api-market-countervalues

## 0.2.2-next.0

### Patch Changes

- Updated dependencies [[`5e2a324`](https://github.com/LedgerHQ/ledger-live/commit/5e2a3245cc163b6cc13ef5fd2b7faa85c84ca153), [`0953772`](https://github.com/LedgerHQ/ledger-live/commit/0953772eafec52773cf7a19c08295c72a2e296a2)]:
  - @shared/api-services@0.11.0-next.0
  - @domain/entity-currency@0.4.8-next.0
  - @domain/entity-market-countervalues@0.4.1-next.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be), [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a)]:
  - @domain/entity-market-countervalues@0.4.0
  - @domain/entity-currency@0.4.7
  - @shared/api-services@0.10.1

## 0.2.1-next.0

### Patch Changes

- Updated dependencies [[`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be), [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a)]:
  - @domain/entity-market-countervalues@0.4.0-next.0
  - @domain/entity-currency@0.4.7-next.0
  - @shared/api-services@0.10.1-next.0

## 0.2.0

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

### Patch Changes

- Updated dependencies [[`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c), [`9ddaa97`](https://github.com/LedgerHQ/ledger-live/commit/9ddaa970d609f4b54f0cdbbda0609242cca54cf7), [`e80d009`](https://github.com/LedgerHQ/ledger-live/commit/e80d009b57fbec125c43649fcc0b21edc60cb473), [`33094bc`](https://github.com/LedgerHQ/ledger-live/commit/33094bc31d9d8cd7a80b8eae3cf2b4afe3afa500)]:
  - @domain/entity-market-countervalues@0.3.0
  - @shared/api-services@0.10.0
  - @domain/entity-currency@0.4.6

## 0.2.0-next.0

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

### Patch Changes

- Updated dependencies [[`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c), [`9ddaa97`](https://github.com/LedgerHQ/ledger-live/commit/9ddaa970d609f4b54f0cdbbda0609242cca54cf7), [`e80d009`](https://github.com/LedgerHQ/ledger-live/commit/e80d009b57fbec125c43649fcc0b21edc60cb473), [`33094bc`](https://github.com/LedgerHQ/ledger-live/commit/33094bc31d9d8cd7a80b8eae3cf2b4afe3afa500)]:
  - @domain/entity-market-countervalues@0.3.0-next.0
  - @shared/api-services@0.10.0-next.0
  - @domain/entity-currency@0.4.6-next.0
