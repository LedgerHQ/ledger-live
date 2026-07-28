# @ledgerhq/wallet-btc

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
