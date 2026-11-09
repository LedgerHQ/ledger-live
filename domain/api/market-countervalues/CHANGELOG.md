# @domain/api-market-countervalues

## 0.3.0-next.0

### Minor Changes

- [#24215](https://github.com/LedgerHQ/ledger-live/pull/24215) [`7185de6`](https://github.com/LedgerHQ/ledger-live/commit/7185de6c3886010f3eac7cee2128eb883230e872) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Value each operation in the fiat a query asks for, at its date, with the `countervalue` query

- [#24311](https://github.com/LedgerHQ/ledger-live/pull/24311) [`ac116ba`](https://github.com/LedgerHQ/ledger-live/commit/ac116baae8763f331fd21885be36474933b52dff) Thanks [@ysitbon](https://github.com/ysitbon)! - Brand the fiat currency ticker as `FiatCurrencyTicker` (three uppercase letters) in `@domain/entity-currency-fiat` and use it for operation countervalues and the analytics fiat, replacing `CountervalueTicker` and the unused `FiatCurrencyId`.

- [#24370](https://github.com/LedgerHQ/ledger-live/pull/24370) [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4) Thanks [@ysitbon](https://github.com/ysitbon)! - Add `CryptoOrTokenCurrencyIdSchema` and `CryptoOrTokenCurrencyId` to `@domain/entity-currency`, replacing the duplicated `BalanceAssetIdSchema`, `ContactCurrencyIdSchema` and the send flow's local union. Runtime parsing is unchanged.

- [#24392](https://github.com/LedgerHQ/ledger-live/pull/24392) [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @reduxjs/toolkit to v2.13.0

  - Updated `@reduxjs/toolkit` to `2.13.0`

- [#24522](https://github.com/LedgerHQ/ledger-live/pull/24522) [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Import bignumber.js through its default export, the form bignumber.js 11 types support

### Patch Changes

- Updated dependencies [[`7185de6`](https://github.com/LedgerHQ/ledger-live/commit/7185de6c3886010f3eac7cee2128eb883230e872), [`522d62b`](https://github.com/LedgerHQ/ledger-live/commit/522d62b80064e808746ad88be9c79d8477b1bf44), [`ac116ba`](https://github.com/LedgerHQ/ledger-live/commit/ac116baae8763f331fd21885be36474933b52dff), [`842a9a5`](https://github.com/LedgerHQ/ledger-live/commit/842a9a547be2224eec86295c57c288f0c51f8fbd), [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @domain/entity-account-operation@0.2.0-next.0
  - @domain/entity-currency-fiat@0.6.0-next.0
  - @domain/api-account-data@0.5.0-next.0
  - @domain/entity-currency@0.5.0-next.0
  - @domain/entity-account-balance@0.3.0-next.0
  - @domain/entity-market-countervalues@0.5.0-next.0
  - @shared/api-services@0.13.0-next.0

## 0.2.3

### Patch Changes

- Updated dependencies [[`0c62d35`](https://github.com/LedgerHQ/ledger-live/commit/0c62d3533f72e450c2235f8d23aa1cdb101486a9)]:
  - @shared/api-services@0.12.0
  - @domain/entity-currency@0.4.9
  - @domain/entity-market-countervalues@0.4.2

## 0.2.3-next.0

### Patch Changes

- Updated dependencies [[`0c62d35`](https://github.com/LedgerHQ/ledger-live/commit/0c62d3533f72e450c2235f8d23aa1cdb101486a9)]:
  - @shared/api-services@0.12.0-next.0
  - @domain/entity-currency@0.4.9-next.0
  - @domain/entity-market-countervalues@0.4.2-next.0

## 0.2.2

### Patch Changes

- Updated dependencies [[`5e2a324`](https://github.com/LedgerHQ/ledger-live/commit/5e2a3245cc163b6cc13ef5fd2b7faa85c84ca153), [`0953772`](https://github.com/LedgerHQ/ledger-live/commit/0953772eafec52773cf7a19c08295c72a2e296a2)]:
  - @shared/api-services@0.11.0
  - @domain/entity-currency@0.4.8
  - @domain/entity-market-countervalues@0.4.1

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
