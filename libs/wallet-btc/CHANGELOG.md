# @ledgerhq/wallet-btc

## 0.4.0

### Minor Changes

- [#21420](https://github.com/LedgerHQ/ledger-live/pull/21420) [`0152cad`](https://github.com/LedgerHQ/ledger-live/commit/0152cade87e061bb2b56fd71f8a404c3dfed21e0) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Fix an undecodable/corrupted xpub crashing the whole Bitcoin address-scan block. `getPubkeyAt` now throws a typed `InvalidXpub` error; `checkAddressesBlock` uses `Promise.allSettled` so a bad xpub no longer aborts the block scan.

- [#21388](https://github.com/LedgerHQ/ledger-live/pull/21388) [`6656f90`](https://github.com/LedgerHQ/ledger-live/commit/6656f90769c3419e1f121c0c2368eab4566e48ba) Thanks [@pawell24](https://github.com/pawell24)! - Add the missing `zcash_regtest` case to `cryptoFactory`, so the Zcash regtest currency used by the coin-tester no longer throws in `wallet-btc`'s crypto factory switch.

## 0.4.0-next.0

### Minor Changes

- [#21420](https://github.com/LedgerHQ/ledger-live/pull/21420) [`0152cad`](https://github.com/LedgerHQ/ledger-live/commit/0152cade87e061bb2b56fd71f8a404c3dfed21e0) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Fix an undecodable/corrupted xpub crashing the whole Bitcoin address-scan block. `getPubkeyAt` now throws a typed `InvalidXpub` error; `checkAddressesBlock` uses `Promise.allSettled` so a bad xpub no longer aborts the block scan.

- [#21388](https://github.com/LedgerHQ/ledger-live/pull/21388) [`6656f90`](https://github.com/LedgerHQ/ledger-live/commit/6656f90769c3419e1f121c0c2368eab4566e48ba) Thanks [@pawell24](https://github.com/pawell24)! - Add the missing `zcash_regtest` case to `cryptoFactory`, so the Zcash regtest currency used by the coin-tester no longer throws in `wallet-btc`'s crypto factory switch.

## 0.3.0

### Minor Changes

- [#20070](https://github.com/LedgerHQ/ledger-live/pull/20070) [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d) Thanks [@ysitbon](https://github.com/ysitbon)! - Remove the now-dead `@ledgerhq/cryptoassets` currency/fiat store injection from the app bootstraps. Nothing reads the legacy currency/fiat accessors anymore (the runtime source of truth is the domain-backed wallet-framework currency resolver), so `setCryptoCurrenciesStore` / `setFiatCurrenciesStore` injected a store no consumer queried. Drop the calls, drop the `@ledgerhq/cryptoassets` dependency from the apps, and remove the remaining stale references to the package in comments.

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0)]:
  - @ledgerhq/errors@7.0.0
  - @ledgerhq/live-network@3.0.0

## 0.3.0-next.0

### Minor Changes

- [#20070](https://github.com/LedgerHQ/ledger-live/pull/20070) [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d) Thanks [@ysitbon](https://github.com/ysitbon)! - Remove the now-dead `@ledgerhq/cryptoassets` currency/fiat store injection from the app bootstraps. Nothing reads the legacy currency/fiat accessors anymore (the runtime source of truth is the domain-backed wallet-framework currency resolver), so `setCryptoCurrenciesStore` / `setFiatCurrenciesStore` injected a store no consumer queried. Drop the calls, drop the `@ledgerhq/cryptoassets` dependency from the apps, and remove the remaining stale references to the package in comments.

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0)]:
  - @ledgerhq/errors@7.0.0-next.0
  - @ledgerhq/live-network@3.0.0-next.0

## 0.2.0

### Minor Changes

- [#19736](https://github.com/LedgerHQ/ledger-live/pull/19736) [`2eac6a1`](https://github.com/LedgerHQ/ledger-live/commit/2eac6a17b629be3f8ba08cdf650413083b89476e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Extract the shared UTXO engine (xpub scanning, coin-selection, storage, address crypto) into a standalone `@ledgerhq/wallet-btc` package, dependency-inverted so it no longer imports `@ledgerhq/cryptoassets` or `@ledgerhq/ledger-wallet-framework`: the currency is injected as a typed `WalletBtcCurrency`. Transaction build/sign, RBF fee computation, the device signer, and the `getWalletAccount` resolver stay in `@ledgerhq/coin-bitcoin`. Internal refactor with no behavior change; consumers (`@ledgerhq/live-common`, `ledger-live-desktop`) are rewired to the new import paths.

### Patch Changes

- Updated dependencies [[`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193)]:
  - @ledgerhq/live-network@2.7.0

## 0.2.0-next.0

### Minor Changes

- [#19736](https://github.com/LedgerHQ/ledger-live/pull/19736) [`2eac6a1`](https://github.com/LedgerHQ/ledger-live/commit/2eac6a17b629be3f8ba08cdf650413083b89476e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Extract the shared UTXO engine (xpub scanning, coin-selection, storage, address crypto) into a standalone `@ledgerhq/wallet-btc` package, dependency-inverted so it no longer imports `@ledgerhq/cryptoassets` or `@ledgerhq/ledger-wallet-framework`: the currency is injected as a typed `WalletBtcCurrency`. Transaction build/sign, RBF fee computation, the device signer, and the `getWalletAccount` resolver stay in `@ledgerhq/coin-bitcoin`. Internal refactor with no behavior change; consumers (`@ledgerhq/live-common`, `ledger-live-desktop`) are rewired to the new import paths.

### Patch Changes

- Updated dependencies [[`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193)]:
  - @ledgerhq/live-network@2.7.0-next.0
