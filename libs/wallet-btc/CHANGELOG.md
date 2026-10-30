# @ledgerhq/wallet-btc

## 1.1.0-next.0

### Minor Changes

- [#23988](https://github.com/LedgerHQ/ledger-live/pull/23988) [`d37d80e`](https://github.com/LedgerHQ/ledger-live/commit/d37d80e128d89fcd80630fd4ef13c66587e3bebe) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Bump `bitcoinjs-lib` to 7.0.5 and `bip39` to 3.1.2

- [#23708](https://github.com/LedgerHQ/ledger-live/pull/23708) [`dd056b8`](https://github.com/LedgerHQ/ledger-live/commit/dd056b8a4c6c7c28879cfb1c44139b2479281987) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump ts-libs packages (`@ledgerhq/auth` 0.1.1, `@ledgerhq/devices` 8.18.1, `@ledgerhq/hw-transport` 6.36.1, `@ledgerhq/hw-transport-mocker` 6.35.1, `@ledgerhq/hw-ledger-key-ring-protocol` 1.0.1, `@ledgerhq/ledger-key-ring-protocol` 1.1.0, `@ledgerhq/live-config` 3.9.1, `@ledgerhq/psbtv2` 0.6.2), `zod` 4.6.7, `semver` 7.8.5, `lodash` 4.18.1, and catalog `bitcoinjs-lib` 7.0.4.

- [#23465](https://github.com/LedgerHQ/ledger-live/pull/23465) [`c4b7982`](https://github.com/LedgerHQ/ledger-live/commit/c4b79825af9468fbb8f5325e77e47536d6b392e9) Thanks [@ysitbon](https://github.com/ysitbon)! - chore(coin): prefix unused parameters with an underscore

  The packages now build with `noUnusedLocals` and `noUnusedParameters`. The parameters they never read are renamed with a leading underscore; signatures and behaviour are unchanged.

- [#23846](https://github.com/LedgerHQ/ledger-live/pull/23846) [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359) Thanks [@gre-ledger](https://github.com/gre-ledger)! - fix: ship lib and lib-es in the npm tarballs again, which pnpm 11 dropped

## 1.0.0

### Major Changes

- [#22964](https://github.com/LedgerHQ/ledger-live/pull/22964) [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(wallet-btc): inject `logger` instead of using `@ledgerhq/logs`

### Minor Changes

- [#23214](https://github.com/LedgerHQ/ledger-live/pull/23214) [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate bitcoinjs-lib to v7 (Uint8Array, bigint amounts) and varuint-bitcoin to v2

- [#23108](https://github.com/LedgerHQ/ledger-live/pull/23108) [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@noble/curves` to 2.4.0 (ESM-only), use the `.js` subpaths and pass `prehash: false` where a digest is signed or verified. CommonJS consumers of `@ledgerhq/hw-app-btc` and `@ledgerhq/wallet-btc` now need Node >= 20.19 (synchronous `require(esm)`) or an ESM-capable bundler.

## 1.0.0-next.0

### Major Changes

- [#22964](https://github.com/LedgerHQ/ledger-live/pull/22964) [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(wallet-btc): inject `logger` instead of using `@ledgerhq/logs`

### Minor Changes

- [#23214](https://github.com/LedgerHQ/ledger-live/pull/23214) [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate bitcoinjs-lib to v7 (Uint8Array, bigint amounts) and varuint-bitcoin to v2

- [#23108](https://github.com/LedgerHQ/ledger-live/pull/23108) [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@noble/curves` to 2.4.0 (ESM-only), use the `.js` subpaths and pass `prehash: false` where a digest is signed or verified. CommonJS consumers of `@ledgerhq/hw-app-btc` and `@ledgerhq/wallet-btc` now need Node >= 20.19 (synchronous `require(esm)`) or an ESM-capable bundler.

## 0.7.0

### Minor Changes

- [#23189](https://github.com/LedgerHQ/ledger-live/pull/23189) [`6e3211f`](https://github.com/LedgerHQ/ledger-live/commit/6e3211f6c887211d4ecfbf58d909f49c31df6179) Thanks [@cted-ledger](https://github.com/cted-ledger)! - add the zcash testnet currency with its own address version bytes

- [#22759](https://github.com/LedgerHQ/ledger-live/pull/22759) [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-bitcoin): read the explorer and tuning values from the injected coin config

  The module no longer keeps configuration in module state. `createBridges` takes a `Context`
  (ADR-019) and every bridge method resolves `config_currency_<id>` from `context.config()` at call
  time. The endpoint `explorer.url` is required and defaults to today's production host in each
  served `config_currency_<id>` (`http://localhost:9876` for `bitcoin_regtest`, whose `btc_regtest`
  explorer id also moves to its config). The optional fields fall back to named module defaults:
  `explorer.batchSize` (`DEFAULT_EXPLORER_BATCH_SIZE`, 1000), `fees.stuckTransactionTimeoutMs`
  (`DEFAULT_STUCK_TRANSACTION_TIMEOUT_MS`, 20 min), `fees.rbfMinBumpRatio`
  (`DEFAULT_RBF_MIN_BUMP_RATIO`, 0.1), `fees.calculationCacheTtlMs` and `fees.feeRatesCacheTtlMs`
  (5 min each) and `sync.replacedOperationExpiryMs` (`DEFAULT_REPLACED_OPERATION_EXPIRY_MS`, 2 h).
  The explorer is bound to a wallet-btc account from the config at use, so deserialization stays
  config-free and a remote change applies on the next call. wallet-btc still reads no configuration:
  the batch size is injected through `WalletBtcCurrency.explorerBatchSize`, and the RBF ratio and
  the unconfirmed-operation expiry are parameters.

  Breaking: `createBridges(signerContext, context)` takes a `Context` instead of a config getter;
  `setCoinConfig`, `getCoinConfig`, `CoinConfig`, `BitcoinConfigInfo`, `makeAssignFromAccountRaw`
  and `getMinRelayFee` are removed in favour of `BitcoinCoinConfig` / `BitcoinContext` and
  `assignFromAccountRaw`, and `postSync` becomes `makePostSync(context)`. The module logs only
  through `context.logger`: `buildTransaction`, `getTransactionStatus`, `prepareTransaction`,
  `calculateFees`, `signAccountTx`, `ChainAdapter.resolveFeePerByte`, `buildSignRawOperation` and the
  `hw-getAddress` / `hw-getFullViewingKey` resolvers take a `Logger`. `prepareTransaction`, `getTransactionStatus`, `buildTransaction`,
  `buildAccountTx`, `getOriginalTxFeeContext`, `getMinReplacementFeeSat`,
  `getMinReplacementFeeRateSatVb` and `getRbfContext` take the coin config as first parameter. The
  `getEditTransactionStatus` and `isStrategyDisabled` bridge extensions require the `mainAccount`. The `EXPLORER_REGTEST` and `BITCOIN_STUCK_TRANSACTION_TIMEOUT` envs are
  removed, as are the `config_currency_<id>` defaults of the bitcoin-family currencies no loader
  serves (`bitcoin_private`, `game_credits`, `gochain`, `lbry`, `nix`, `ravencoin`, `resistance`,
  `zclassic`, `zcoin`).

## 0.7.0-next.0

### Minor Changes

- [#23189](https://github.com/LedgerHQ/ledger-live/pull/23189) [`6e3211f`](https://github.com/LedgerHQ/ledger-live/commit/6e3211f6c887211d4ecfbf58d909f49c31df6179) Thanks [@cted-ledger](https://github.com/cted-ledger)! - add the zcash testnet currency with its own address version bytes

- [#22759](https://github.com/LedgerHQ/ledger-live/pull/22759) [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-bitcoin): read the explorer and tuning values from the injected coin config

  The module no longer keeps configuration in module state. `createBridges` takes a `Context`
  (ADR-019) and every bridge method resolves `config_currency_<id>` from `context.config()` at call
  time. The endpoint `explorer.url` is required and defaults to today's production host in each
  served `config_currency_<id>` (`http://localhost:9876` for `bitcoin_regtest`, whose `btc_regtest`
  explorer id also moves to its config). The optional fields fall back to named module defaults:
  `explorer.batchSize` (`DEFAULT_EXPLORER_BATCH_SIZE`, 1000), `fees.stuckTransactionTimeoutMs`
  (`DEFAULT_STUCK_TRANSACTION_TIMEOUT_MS`, 20 min), `fees.rbfMinBumpRatio`
  (`DEFAULT_RBF_MIN_BUMP_RATIO`, 0.1), `fees.calculationCacheTtlMs` and `fees.feeRatesCacheTtlMs`
  (5 min each) and `sync.replacedOperationExpiryMs` (`DEFAULT_REPLACED_OPERATION_EXPIRY_MS`, 2 h).
  The explorer is bound to a wallet-btc account from the config at use, so deserialization stays
  config-free and a remote change applies on the next call. wallet-btc still reads no configuration:
  the batch size is injected through `WalletBtcCurrency.explorerBatchSize`, and the RBF ratio and
  the unconfirmed-operation expiry are parameters.

  Breaking: `createBridges(signerContext, context)` takes a `Context` instead of a config getter;
  `setCoinConfig`, `getCoinConfig`, `CoinConfig`, `BitcoinConfigInfo`, `makeAssignFromAccountRaw`
  and `getMinRelayFee` are removed in favour of `BitcoinCoinConfig` / `BitcoinContext` and
  `assignFromAccountRaw`, and `postSync` becomes `makePostSync(context)`. The module logs only
  through `context.logger`: `buildTransaction`, `getTransactionStatus`, `prepareTransaction`,
  `calculateFees`, `signAccountTx`, `ChainAdapter.resolveFeePerByte`, `buildSignRawOperation` and the
  `hw-getAddress` / `hw-getFullViewingKey` resolvers take a `Logger`. `prepareTransaction`, `getTransactionStatus`, `buildTransaction`,
  `buildAccountTx`, `getOriginalTxFeeContext`, `getMinReplacementFeeSat`,
  `getMinReplacementFeeRateSatVb` and `getRbfContext` take the coin config as first parameter. The
  `getEditTransactionStatus` and `isStrategyDisabled` bridge extensions require the `mainAccount`. The `EXPLORER_REGTEST` and `BITCOIN_STUCK_TRANSACTION_TIMEOUT` envs are
  removed, as are the `config_currency_<id>` defaults of the bitcoin-family currencies no loader
  serves (`bitcoin_private`, `game_credits`, `gochain`, `lbry`, `nix`, `ravencoin`, `resistance`,
  `zclassic`, `zcoin`).

## 0.6.0

### Minor Changes

- [#22143](https://github.com/LedgerHQ/ledger-live/pull/22143) [`29ce771`](https://github.com/LedgerHQ/ledger-live/commit/29ce7712ce93cd27afa97eda2d14a0ff066551fb) Thanks [@gre-ledger](https://github.com/gre-ledger)! - refactor(noble-curves): replace the APIs @noble/curves 2.x renames away

## 0.6.0-next.0

### Minor Changes

- [#22143](https://github.com/LedgerHQ/ledger-live/pull/22143) [`29ce771`](https://github.com/LedgerHQ/ledger-live/commit/29ce7712ce93cd27afa97eda2d14a0ff066551fb) Thanks [@gre-ledger](https://github.com/gre-ledger)! - refactor(noble-curves): replace the APIs @noble/curves 2.x renames away

## 0.5.0

### Minor Changes

- [#21950](https://github.com/LedgerHQ/ledger-live/pull/21950) [`30828c2`](https://github.com/LedgerHQ/ledger-live/commit/30828c22cc44c9929d7eda782e9d559a9e0145c3) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore(deps): source @noble/curves and @noble/hashes from the pnpm catalog

## 0.5.0-next.0

### Minor Changes

- [#21950](https://github.com/LedgerHQ/ledger-live/pull/21950) [`30828c2`](https://github.com/LedgerHQ/ledger-live/commit/30828c22cc44c9929d7eda782e9d559a9e0145c3) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore(deps): source @noble/curves and @noble/hashes from the pnpm catalog

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
