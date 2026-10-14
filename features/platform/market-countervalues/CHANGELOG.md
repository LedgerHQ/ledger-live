# @features/platform-market-countervalues

## 0.2.0

### Minor Changes

- [#23001](https://github.com/LedgerHQ/ledger-live/pull/23001) [`21ab07f`](https://github.com/LedgerHQ/ledger-live/commit/21ab07f8912d9c7fa9fb7e438e4e7873ca674f02) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the countervalues Redux slice into `@features/platform-market-countervalues`: its reducer, action creators, initial state, state type and selectors. Both apps now mount `countervaluesReducer` at the same `countervalues` store key and keep their own `useSelector` hooks, persistence, polling and user-settings computation. The action types keep the desktop strings, so mobile's pending, error and wipe actions are now named `COUNTERVALUES_STATE_SET_PENDING`, `COUNTERVALUES_STATE_SET_ERROR` and `COUNTERVALUES_WIPE`. The reducer stays a plain function rather than `createSlice`, because immer would freeze the rate maps that `loadCountervalues` updates in place.

- [#23107](https://github.com/LedgerHQ/ledger-live/pull/23107) [`fa2c070`](https://github.com/LedgerHQ/ledger-live/commit/fa2c070913fb13e530c65d901151c2766c46caf6) Thanks [@ysitbon](https://github.com/ysitbon)! - Countervalues user settings are no longer stored in Redux: each app computes them and hands them to the provider through the bridge's `useUserSettings`.

  - `@features/platform-market-countervalues`: the slice loses its `userSettings` field, `setCountervaluesUserSettings` (`COUNTERVALUES_USER_SETTINGS_SET`) and `countervaluesUserSettingsSelector`.
  - Desktop: `useCalculateCountervaluesUserSettings` returns the memoized settings instead of dispatching them, and the bridge calls it directly. The provider sees the real tracking pairs and refresh rate from the first render instead of one render late, so the saved rates are restored once and the boot loads once.
  - Mobile: no runtime change; its tests read a shared test settings constant instead of the removed slice field.

- [#22977](https://github.com/LedgerHQ/ledger-live/pull/22977) [`c26bbea`](https://github.com/LedgerHQ/ledger-live/commit/c26bbea7477d27f6042657c3a3c48c05f85b1f59) Thanks [@ysitbon](https://github.com/ysitbon)! - `@features/platform-market-countervalues` is now the only countervalues React glue in the monorepo.

  - The platform package no longer exports `CountervaluesContext`. It was public only so the old React package could share one context during the migration. Read countervalues through the package hooks, under a `CountervaluesProvider`.
  - live-common no longer has `counterValues/*`: its own `useUsdToFiatRate` and `useGetCounterValueIdsPolling` are removed. Import both from `@features/platform-market-countervalues`.

- [#22865](https://github.com/LedgerHQ/ledger-live/pull/22865) [`667d378`](https://github.com/LedgerHQ/ledger-live/commit/667d378b97e9102df009015e01fed6b49fd88b82) Thanks [@ysitbon](https://github.com/ysitbon)! - Add `@features/platform-market-countervalues`, the countervalues React glue: the provider, its context and the hooks reading it, plus `useUsdToFiatRate` and `useGetCounterValueIdsPolling`. It is a copy of `@ledgerhq/live-countervalues-react` and of the two live-common hooks, which keep their own until their consumers move over.

  - `@ledgerhq/live-countervalues-react` reads the platform package's `CountervaluesContext` instead of creating its own, so a provider from either package serves the hooks of both. It stops exporting `CountervaluesContext`, which nothing imported, and drops its unused `@ledgerhq/types-live` dependency.
  - The platform package depends on no logging library. Desktop and mobile hand it their logger with `setCountervaluesLogger` at app setup, next to the rate lookups.

### Patch Changes

- Updated dependencies [[`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c), [`9ddaa97`](https://github.com/LedgerHQ/ledger-live/commit/9ddaa970d609f4b54f0cdbbda0609242cca54cf7), [`e80d009`](https://github.com/LedgerHQ/ledger-live/commit/e80d009b57fbec125c43649fcc0b21edc60cb473), [`33094bc`](https://github.com/LedgerHQ/ledger-live/commit/33094bc31d9d8cd7a80b8eae3cf2b4afe3afa500)]:
  - @domain/api-market-countervalues@0.2.0
  - @domain/entity-market-countervalues@0.3.0
  - @domain/entity-currency@0.4.6
  - @domain/entity-currency-unit@0.3.0

## 0.2.0-next.0

### Minor Changes

- [#23001](https://github.com/LedgerHQ/ledger-live/pull/23001) [`21ab07f`](https://github.com/LedgerHQ/ledger-live/commit/21ab07f8912d9c7fa9fb7e438e4e7873ca674f02) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the countervalues Redux slice into `@features/platform-market-countervalues`: its reducer, action creators, initial state, state type and selectors. Both apps now mount `countervaluesReducer` at the same `countervalues` store key and keep their own `useSelector` hooks, persistence, polling and user-settings computation. The action types keep the desktop strings, so mobile's pending, error and wipe actions are now named `COUNTERVALUES_STATE_SET_PENDING`, `COUNTERVALUES_STATE_SET_ERROR` and `COUNTERVALUES_WIPE`. The reducer stays a plain function rather than `createSlice`, because immer would freeze the rate maps that `loadCountervalues` updates in place.

- [#23107](https://github.com/LedgerHQ/ledger-live/pull/23107) [`fa2c070`](https://github.com/LedgerHQ/ledger-live/commit/fa2c070913fb13e530c65d901151c2766c46caf6) Thanks [@ysitbon](https://github.com/ysitbon)! - Countervalues user settings are no longer stored in Redux: each app computes them and hands them to the provider through the bridge's `useUserSettings`.

  - `@features/platform-market-countervalues`: the slice loses its `userSettings` field, `setCountervaluesUserSettings` (`COUNTERVALUES_USER_SETTINGS_SET`) and `countervaluesUserSettingsSelector`.
  - Desktop: `useCalculateCountervaluesUserSettings` returns the memoized settings instead of dispatching them, and the bridge calls it directly. The provider sees the real tracking pairs and refresh rate from the first render instead of one render late, so the saved rates are restored once and the boot loads once.
  - Mobile: no runtime change; its tests read a shared test settings constant instead of the removed slice field.

- [#22977](https://github.com/LedgerHQ/ledger-live/pull/22977) [`c26bbea`](https://github.com/LedgerHQ/ledger-live/commit/c26bbea7477d27f6042657c3a3c48c05f85b1f59) Thanks [@ysitbon](https://github.com/ysitbon)! - `@features/platform-market-countervalues` is now the only countervalues React glue in the monorepo.

  - The platform package no longer exports `CountervaluesContext`. It was public only so the old React package could share one context during the migration. Read countervalues through the package hooks, under a `CountervaluesProvider`.
  - live-common no longer has `counterValues/*`: its own `useUsdToFiatRate` and `useGetCounterValueIdsPolling` are removed. Import both from `@features/platform-market-countervalues`.

- [#22865](https://github.com/LedgerHQ/ledger-live/pull/22865) [`667d378`](https://github.com/LedgerHQ/ledger-live/commit/667d378b97e9102df009015e01fed6b49fd88b82) Thanks [@ysitbon](https://github.com/ysitbon)! - Add `@features/platform-market-countervalues`, the countervalues React glue: the provider, its context and the hooks reading it, plus `useUsdToFiatRate` and `useGetCounterValueIdsPolling`. It is a copy of `@ledgerhq/live-countervalues-react` and of the two live-common hooks, which keep their own until their consumers move over.

  - `@ledgerhq/live-countervalues-react` reads the platform package's `CountervaluesContext` instead of creating its own, so a provider from either package serves the hooks of both. It stops exporting `CountervaluesContext`, which nothing imported, and drops its unused `@ledgerhq/types-live` dependency.
  - The platform package depends on no logging library. Desktop and mobile hand it their logger with `setCountervaluesLogger` at app setup, next to the rate lookups.

### Patch Changes

- Updated dependencies [[`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c), [`9ddaa97`](https://github.com/LedgerHQ/ledger-live/commit/9ddaa970d609f4b54f0cdbbda0609242cca54cf7), [`e80d009`](https://github.com/LedgerHQ/ledger-live/commit/e80d009b57fbec125c43649fcc0b21edc60cb473), [`33094bc`](https://github.com/LedgerHQ/ledger-live/commit/33094bc31d9d8cd7a80b8eae3cf2b4afe3afa500)]:
  - @domain/api-market-countervalues@0.2.0-next.0
  - @domain/entity-market-countervalues@0.3.0-next.0
  - @domain/entity-currency@0.4.6-next.0
  - @domain/entity-currency-unit@0.3.0
