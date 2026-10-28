# @ledgerhq/types-live

## 6.128.0

### Minor Changes

- [#23249](https://github.com/LedgerHQ/ledger-live/pull/23249) [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954) Thanks [@dilaouid](https://github.com/dilaouid)! - Add generic account sequence synchronization and persist it on the account

- [#23386](https://github.com/LedgerHQ/ledger-live/pull/23386) [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574) Thanks [@dilaouid](https://github.com/dilaouid)! - Remove the Zenrock and Quicksilver integrations, including their chain adapters, currency definitions, feature flags and LCD endpoints

- [#23331](https://github.com/LedgerHQ/ledger-live/pull/23331) [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - remove velas_evm and its feature flag

## 6.128.0-next.0

### Minor Changes

- [#23249](https://github.com/LedgerHQ/ledger-live/pull/23249) [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954) Thanks [@dilaouid](https://github.com/dilaouid)! - Add generic account sequence synchronization and persist it on the account

- [#23386](https://github.com/LedgerHQ/ledger-live/pull/23386) [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574) Thanks [@dilaouid](https://github.com/dilaouid)! - Remove the Zenrock and Quicksilver integrations, including their chain adapters, currency definitions, feature flags and LCD endpoints

- [#23331](https://github.com/LedgerHQ/ledger-live/pull/23331) [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - remove velas_evm and its feature flag

## 6.127.0

### Minor Changes

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

- [#23194](https://github.com/LedgerHQ/ledger-live/pull/23194) [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Remove 20 dead EVM chains (akroma, atheios, callisto, dexon, ellaism, ether1, ethergem, ethersocial, expanse, gochain, hpb, mix, musicoin, pirl, poa, reosc, thundercore, tomo, ubiq, wanchain)

- [#22750](https://github.com/LedgerHQ/ledger-live/pull/22750) [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(currency): drop `CryptoCurrency#ethereumLikeInfo`

  The EVM `chainId` is now read from the coin config. The unused `ethereumLikeInfo` field (and `EthereumLikeInfoSchema`) is removed from the currency types and registry.

- [#23044](https://github.com/LedgerHQ/ledger-live/pull/23044) [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the lwmQuickActionsCtasVariant feature flag and its Receive/Send quick action CTAs variant

- [#22958](https://github.com/LedgerHQ/ledger-live/pull/22958) [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove leftovers of the dropped Sentry integration: the unused `llmSentry` feature flag and `DatadogId.exportDatadogIdForSentry`.

- [#23032](https://github.com/LedgerHQ/ledger-live/pull/23032) [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(live-dmk): remove the ldmkTransport feature flag

  `DeviceManagementKitProvider` on desktop no longer takes `ldmkTransportEnabled` and always provides
  the Device Management Kit. `useDeviceManagementKit` now returns a non-null `DeviceManagementKit` and
  throws outside the provider. The PayTab address verification always uses the Device Intent Executor,
  and the `isLDMKTransportEnabled` analytics property is removed.

- [#22059](https://github.com/LedgerHQ/ledger-live/pull/22059) [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): Migrate the desktop staking UI onto the generic path

- [#22953](https://github.com/LedgerHQ/ledger-live/pull/22953) [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(device): remove the legacy connectApp and the ldmkConnectApp feature flag

  `connectApp` and `connectManager` now always use the Device Management Kit device actions and fail
  with `DmkTransportRequired` on a non-DMK transport. `apps/inlineAppInstall`, `hw/isUpdateAvailable`
  and `DeviceManagementKitTransport.listenLegacyConnectApp` are removed.

## 6.127.0-next.0

### Minor Changes

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

- [#23194](https://github.com/LedgerHQ/ledger-live/pull/23194) [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Remove 20 dead EVM chains (akroma, atheios, callisto, dexon, ellaism, ether1, ethergem, ethersocial, expanse, gochain, hpb, mix, musicoin, pirl, poa, reosc, thundercore, tomo, ubiq, wanchain)

- [#22750](https://github.com/LedgerHQ/ledger-live/pull/22750) [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(currency): drop `CryptoCurrency#ethereumLikeInfo`

  The EVM `chainId` is now read from the coin config. The unused `ethereumLikeInfo` field (and `EthereumLikeInfoSchema`) is removed from the currency types and registry.

- [#23044](https://github.com/LedgerHQ/ledger-live/pull/23044) [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the lwmQuickActionsCtasVariant feature flag and its Receive/Send quick action CTAs variant

- [#22958](https://github.com/LedgerHQ/ledger-live/pull/22958) [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove leftovers of the dropped Sentry integration: the unused `llmSentry` feature flag and `DatadogId.exportDatadogIdForSentry`.

- [#23032](https://github.com/LedgerHQ/ledger-live/pull/23032) [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(live-dmk): remove the ldmkTransport feature flag

  `DeviceManagementKitProvider` on desktop no longer takes `ldmkTransportEnabled` and always provides
  the Device Management Kit. `useDeviceManagementKit` now returns a non-null `DeviceManagementKit` and
  throws outside the provider. The PayTab address verification always uses the Device Intent Executor,
  and the `isLDMKTransportEnabled` analytics property is removed.

- [#22059](https://github.com/LedgerHQ/ledger-live/pull/22059) [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): Migrate the desktop staking UI onto the generic path

- [#22953](https://github.com/LedgerHQ/ledger-live/pull/22953) [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(device): remove the legacy connectApp and the ldmkConnectApp feature flag

  `connectApp` and `connectManager` now always use the Device Management Kit device actions and fail
  with `DmkTransportRequired` on a non-DMK transport. `apps/inlineAppInstall`, `hw/isUpdateAvailable`
  and `DeviceManagementKitTransport.listenLegacyConnectApp` are removed.

## 6.126.0

### Minor Changes

- [#22450](https://github.com/LedgerHQ/ledger-live/pull/22450) [`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(i18n): keep Thai selected across app restarts

  Removes the `llmThai` / `lldThai` feature flags. Flags resolve on their `enabled: false` default
  until the first remote fetch settles, so on every cold start the locale guard saw Thai as
  unsupported and persisted English over the user's choice.

- [#22561](https://github.com/LedgerHQ/ledger-live/pull/22561) [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae) Thanks [@YazhuEth](https://github.com/YazhuEth)! - chore(currency): drop `CryptoCurrency#bitcoinLikeInfo`

  coin-bitcoin now reads the xpub version from its own `getNetworkParameters`, and coin-zcash from a local `ZCASH_XPUB_VERSION` constant. The unused `bitcoinLikeInfo` field (and `BitcoinLikeInfoSchema`) is removed from the currency types and registry.

- [#22361](https://github.com/LedgerHQ/ledger-live/pull/22361) [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Add the DMK-backed Polkadot signer wrapper behind the `ldmkPolkadotSigner` feature flag

  `@ledgerhq/live-signer-polkadot` exports a DMK-backed and a legacy `hw-app-polkadot`-backed
  implementation of `PolkadotSigner`. The polkadot family's signer factory now returns the DMK
  implementation when the transport carries a DMK session and the `ldmkPolkadotSigner` flag is
  enabled, and falls back to the legacy implementation otherwise — with the flag off, every
  polkadot-family currency (polkadot, assethub_polkadot, westend, assethub_westend, bittensor)
  keeps its current behaviour unchanged.

- [#22589](https://github.com/LedgerHQ/ledger-live/pull/22589) [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5) Thanks [@qperrot](https://github.com/qperrot)! - Remove the deprecated `CryptoCurrency.explorerId` field and the `LedgerExplorerId` type.

  Bitcoin-like explorer ids now come from the coin config (`config_currency_<id>.explorerId`), as EVM already does, and fall back to the currency id. The config is passed in rather than read from a module global: `toWalletBtcCurrency`, `walletBtcCurrencyById` and coin-bitcoin's `blockchainBaseURL` take it as an argument, the sync functions take the `coinConfig` resolver given to `createBridges`, and `assignFromAccountRaw` is now built with `makeAssignFromAccountRaw(coinConfig)`.

  Adds `config_currency_bitcoin_testnet`, `config_currency_bitcoin_regtest` and `config_currency_zcash_regtest` so every bitcoin-like currency resolves a config entry.

- [#22054](https://github.com/LedgerHQ/ledger-live/pull/22054) [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Add `@ledgerhq/live-signer-tron`, wrapping `@ledgerhq/device-signer-kit-tron` as `DmkSignerTron`
  alongside the legacy `hw-app-trx` path as `LegacySignerTron`. `families/tron/setup.ts` picks
  between them, using the DMK signer only on a DMK transport with the new `ldmkTronSigner` feature
  flag on. The flag is disabled by default, so Tron keeps signing through `hw-app-trx`.

## 6.126.0-next.0

### Minor Changes

- [#22450](https://github.com/LedgerHQ/ledger-live/pull/22450) [`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(i18n): keep Thai selected across app restarts

  Removes the `llmThai` / `lldThai` feature flags. Flags resolve on their `enabled: false` default
  until the first remote fetch settles, so on every cold start the locale guard saw Thai as
  unsupported and persisted English over the user's choice.

- [#22561](https://github.com/LedgerHQ/ledger-live/pull/22561) [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae) Thanks [@YazhuEth](https://github.com/YazhuEth)! - chore(currency): drop `CryptoCurrency#bitcoinLikeInfo`

  coin-bitcoin now reads the xpub version from its own `getNetworkParameters`, and coin-zcash from a local `ZCASH_XPUB_VERSION` constant. The unused `bitcoinLikeInfo` field (and `BitcoinLikeInfoSchema`) is removed from the currency types and registry.

- [#22361](https://github.com/LedgerHQ/ledger-live/pull/22361) [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Add the DMK-backed Polkadot signer wrapper behind the `ldmkPolkadotSigner` feature flag

  `@ledgerhq/live-signer-polkadot` exports a DMK-backed and a legacy `hw-app-polkadot`-backed
  implementation of `PolkadotSigner`. The polkadot family's signer factory now returns the DMK
  implementation when the transport carries a DMK session and the `ldmkPolkadotSigner` flag is
  enabled, and falls back to the legacy implementation otherwise — with the flag off, every
  polkadot-family currency (polkadot, assethub_polkadot, westend, assethub_westend, bittensor)
  keeps its current behaviour unchanged.

- [#22589](https://github.com/LedgerHQ/ledger-live/pull/22589) [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5) Thanks [@qperrot](https://github.com/qperrot)! - Remove the deprecated `CryptoCurrency.explorerId` field and the `LedgerExplorerId` type.

  Bitcoin-like explorer ids now come from the coin config (`config_currency_<id>.explorerId`), as EVM already does, and fall back to the currency id. The config is passed in rather than read from a module global: `toWalletBtcCurrency`, `walletBtcCurrencyById` and coin-bitcoin's `blockchainBaseURL` take it as an argument, the sync functions take the `coinConfig` resolver given to `createBridges`, and `assignFromAccountRaw` is now built with `makeAssignFromAccountRaw(coinConfig)`.

  Adds `config_currency_bitcoin_testnet`, `config_currency_bitcoin_regtest` and `config_currency_zcash_regtest` so every bitcoin-like currency resolves a config entry.

- [#22054](https://github.com/LedgerHQ/ledger-live/pull/22054) [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Add `@ledgerhq/live-signer-tron`, wrapping `@ledgerhq/device-signer-kit-tron` as `DmkSignerTron`
  alongside the legacy `hw-app-trx` path as `LegacySignerTron`. `families/tron/setup.ts` picks
  between them, using the DMK signer only on a DMK transport with the new `ldmkTronSigner` feature
  flag on. The flag is disabled by default, so Tron keeps signing through `hw-app-trx`.

## 6.125.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

- [#21841](https://github.com/LedgerHQ/ledger-live/pull/21841) [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): migrate account resources to shared staking aggregate

- [#21967](https://github.com/LedgerHQ/ledger-live/pull/21967) [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the obsolete original Wallet V4 tour

## 6.125.0-next.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

- [#21841](https://github.com/LedgerHQ/ledger-live/pull/21841) [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): migrate account resources to shared staking aggregate

- [#21967](https://github.com/LedgerHQ/ledger-live/pull/21967) [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the obsolete original Wallet V4 tour

## 6.124.0

### Minor Changes

- [#21656](https://github.com/LedgerHQ/ledger-live/pull/21656) [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the Q3 Wallet V4 Tour feature flag, persisted seen state, mobile debug setup, and Segment wallet40Attributes.q3Tour

- [#21751](https://github.com/LedgerHQ/ledger-live/pull/21751) [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb) Thanks [@sarneijim](https://github.com/sarneijim)! - Add releaseTour and gate Q2/Q3 tours with it, dropping q2Tour/q3Tour from Wallet 4.0

## 6.124.0-next.0

### Minor Changes

- [#21656](https://github.com/LedgerHQ/ledger-live/pull/21656) [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the Q3 Wallet V4 Tour feature flag, persisted seen state, mobile debug setup, and Segment wallet40Attributes.q3Tour

- [#21751](https://github.com/LedgerHQ/ledger-live/pull/21751) [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb) Thanks [@sarneijim](https://github.com/sarneijim)! - Add releaseTour and gate Q2/Q3 tours with it, dropping q2Tour/q3Tour from Wallet 4.0

## 6.123.0

### Minor Changes

- [#21488](https://github.com/LedgerHQ/ledger-live/pull/21488) [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `delisted` from `CryptoCurrency`. No registry entry ever set it, so the `listCryptoCurrencies()` production filter was testing a dead branch. It stays on `TokenCurrency`, where CAL drives it.

- [#21486](https://github.com/LedgerHQ/ledger-live/pull/21486) [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `deviceTicker` from `CryptoCurrency`. The field was declared in three places and set by 17 testnet/L2 registry entries, but nothing ever read it.

- [#21487](https://github.com/LedgerHQ/ledger-live/pull/21487) [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `disableCountervalue` from `CryptoCurrency`. Nothing read it on a crypto currency; it stays on `TokenCurrency`, where the assets API drives it, and on `FiatCurrency`.

- [#21326](https://github.com/LedgerHQ/ledger-live/pull/21326) [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Drive the XRP app through the Device Management Kit behind the `ldmkXrpSigner` feature flag, keeping `hw-app-xrp` as the fallback

## 6.123.0-next.0

### Minor Changes

- [#21488](https://github.com/LedgerHQ/ledger-live/pull/21488) [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `delisted` from `CryptoCurrency`. No registry entry ever set it, so the `listCryptoCurrencies()` production filter was testing a dead branch. It stays on `TokenCurrency`, where CAL drives it.

- [#21486](https://github.com/LedgerHQ/ledger-live/pull/21486) [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `deviceTicker` from `CryptoCurrency`. The field was declared in three places and set by 17 testnet/L2 registry entries, but nothing ever read it.

- [#21487](https://github.com/LedgerHQ/ledger-live/pull/21487) [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `disableCountervalue` from `CryptoCurrency`. Nothing read it on a crypto currency; it stays on `TokenCurrency`, where the assets API drives it, and on `FiatCurrency`.

- [#21326](https://github.com/LedgerHQ/ledger-live/pull/21326) [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Drive the XRP app through the Device Management Kit behind the `ldmkXrpSigner` feature flag, keeping `hw-app-xrp` as the fallback

## 6.122.0

### Minor Changes

- [#20935](https://github.com/LedgerHQ/ledger-live/pull/20935) [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682) Thanks [@dilaouid](https://github.com/dilaouid)! - Move Solana staking onto the generic `StakingResources` account attribute.

  **Breaking for `@ledgerhq/coin-solana`.** `SolanaResources`, `SolanaResourcesRaw`, `toSolanaResourcesRaw` and `fromSolanaResourcesRaw` are gone. `SolanaAccount` is now an alias of `StakingAccount`, so read staking data from `account.stakingResources` instead of `account.solanaResources`. A stake is a `StakingDelegation` or a `StakingUnbonding` (`SolanaStakingPosition`) rather than a `SolanaStake`: its stake account address is `positionId`, its validator is `validatorAddress`, and the former `activation.active` / `activation.inactive` / `withdrawable` fields are `activeAmount` / `inactiveAmount` / `withdrawableAmount`. `listSolanaStakingPositions`, `solanaActivationState` and `stakeActions` from `@ledgerhq/coin-solana/logic` cover the common access patterns. Accounts already persisted with a `solanaResources` blob are migrated on hydration, so no resync is needed.

  `@ledgerhq/types-live` gains `StakingPositionDetails`, mixed into `StakingDelegation` and `StakingUnbonding` for chains that materialize each position as its own on-chain account, plus `actionFeeReserve` on `StakingResources`. Both are optional, so other chains are unaffected.

  `@ledgerhq/wallet-cli`'s `earn positions` output changes shape: on `EarnSolanaStake`, `stakeBalance` and `withdrawable` go from `number` to an integer decimal string, so lamport amounts above `Number.MAX_SAFE_INTEGER` stay exact. Anything reading those two fields numerically needs updating.

  `@ledgerhq/ledger-wallet-framework` now exports the generic `StakingResources` serializer (`toStakingResourcesRaw`, `fromStakingResourcesRaw`, `assignStakingResourcesToAccountRaw`, `assignStakingResourcesFromAccountRaw`), moved out of the EVM family in `live-common` so every coin module can use it.

## 6.122.0-next.0

### Minor Changes

- [#20935](https://github.com/LedgerHQ/ledger-live/pull/20935) [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682) Thanks [@dilaouid](https://github.com/dilaouid)! - Move Solana staking onto the generic `StakingResources` account attribute.

  **Breaking for `@ledgerhq/coin-solana`.** `SolanaResources`, `SolanaResourcesRaw`, `toSolanaResourcesRaw` and `fromSolanaResourcesRaw` are gone. `SolanaAccount` is now an alias of `StakingAccount`, so read staking data from `account.stakingResources` instead of `account.solanaResources`. A stake is a `StakingDelegation` or a `StakingUnbonding` (`SolanaStakingPosition`) rather than a `SolanaStake`: its stake account address is `positionId`, its validator is `validatorAddress`, and the former `activation.active` / `activation.inactive` / `withdrawable` fields are `activeAmount` / `inactiveAmount` / `withdrawableAmount`. `listSolanaStakingPositions`, `solanaActivationState` and `stakeActions` from `@ledgerhq/coin-solana/logic` cover the common access patterns. Accounts already persisted with a `solanaResources` blob are migrated on hydration, so no resync is needed.

  `@ledgerhq/types-live` gains `StakingPositionDetails`, mixed into `StakingDelegation` and `StakingUnbonding` for chains that materialize each position as its own on-chain account, plus `actionFeeReserve` on `StakingResources`. Both are optional, so other chains are unaffected.

  `@ledgerhq/wallet-cli`'s `earn positions` output changes shape: on `EarnSolanaStake`, `stakeBalance` and `withdrawable` go from `number` to an integer decimal string, so lamport amounts above `Number.MAX_SAFE_INTEGER` stay exact. Anything reading those two fields numerically needs updating.

  `@ledgerhq/ledger-wallet-framework` now exports the generic `StakingResources` serializer (`toStakingResourcesRaw`, `fromStakingResourcesRaw`, `assignStakingResourcesToAccountRaw`, `assignStakingResourcesFromAccountRaw`), moved out of the EVM family in `live-common` so every coin module can use it.

## 6.121.0

### Minor Changes

- [#20887](https://github.com/LedgerHQ/ledger-live/pull/20887) [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

- [#20782](https://github.com/LedgerHQ/ledger-live/pull/20782) [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708) Thanks [@shazzzam](https://github.com/shazzzam)! - Surface ICP neuron staking entry points on mobile: Stake and Manage Neurons account-header actions,
  gated behind the new `llmIcpStaking` feature flag. The StakingFlow and NeuronManageFlow navigators
  are registered as stubs and their screens land separately.

- [#20650](https://github.com/LedgerHQ/ledger-live/pull/20650) [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add a gRPC-web transport to the Sui coin module

  - `coin-sui` gains a third transport on `sui.rpc.v2` over gRPC-web, covering every capability from
    checkpoints to device signing.
  - New tri-state `suiTransport` feature flag (`json` | `grpc` | `graphql`), defaulting to `json`,
    replaces the boolean `suiGraphqlTransport`, which is removed. An unrecognised value resolves to
    `json`.
  - New env vars `API_SUI_GRPC_PROXY` and `API_SUI_TESTNET_GRPC_PROXY`. `@mysten/sui` 2.9.0 → 2.23.1.
  - Operation `blockHash` carries the real checkpoint digest on gRPC.
  - Fix: account sync read a single page of history on GraphQL and gRPC, capping an account at its
    newest 50 operations for good — sync resumes from the newest stored operation and never re-reads
    what it skipped. Both arms now walk up to `TRANSACTIONS_LIMIT` (300), the depth JSON-RPC reached.
  - Fix: a resumed sync on GraphQL and gRPC read backwards from the tip, so when more than
    `TRANSACTIONS_LIMIT` transactions arrived between two syncs, the ones in the middle were skipped
    and the next sync resumed above them — a permanent hole. Both arms now walk forward from the
    cursor, as the JSON-RPC arm already did, leaving anything unread newer than the next resume point.
  - Fix: an account holding no operations resumed from its stored `syncHash`, so a cleared cache came
    back with only the transactions that arrived after it. Such an account now re-reads its history,
    which is also how one truncated by the bug above recovers. Token operations count as history: they
    live in the subaccounts, so a token-only account is no longer treated as empty.
  - Fix: on gRPC, any failure to resolve a cursor's digest — including a transient network error — was
    read as "unknown digest", which falls back to an unbounded page from the tip and made paging report
    the end of history. Only a `NOT_FOUND` does that now; everything else propagates and is retried.
  - Fix: reading history skipped transactions that shared a checkpoint with the resume point, in
    account sync (`getOperations`) as well as paging (`getListOperations`).
  - Fix: paging inferred "more to come" from how many operations survived client-side filtering, which
    ended the walk early. GraphQL now reads `pageInfo`, gRPC the stream's `QueryEnd` reason. A page
    whose transactions were all filtered out now resumes from the page's own boundary instead of
    reporting the end of history.
  - Fix: a gRPC history record with no timestamp became an operation dated 1970 that could not serve as
    a pagination cursor. Those records are now dropped, as the GraphQL arm already did.
  - Fix: ascending paging on GraphQL returned the newest slice of the range instead of walking forward
    from the oldest.
  - Fix: the Sui fetcher dropped `X-Ledger-Client-Version` and all gRPC-web headers when passed a
    `Headers` instance.
  - Fix: GraphQL resolved the latest checkpoint in two queries, so the second could answer null. It is
    now one query.
  - A checkpoint missing its `digest` or `timestamp` now raises on both GraphQL and gRPC, instead of
    reporting a block with an empty hash and a 1970 timestamp.
  - Known limitation: `getListOperations` resumes from a synthesised `timestamp:digest` cursor, so
    within one checkpoint a sibling whose digest sorts earlier can be skipped, and a checkpoint holding
    more than one page is stepped over rather than resumed inside. Account sync is unaffected: it
    resumes from the server's own watermark cursor.

## 6.121.0-next.0

### Minor Changes

- [#20887](https://github.com/LedgerHQ/ledger-live/pull/20887) [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

- [#20782](https://github.com/LedgerHQ/ledger-live/pull/20782) [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708) Thanks [@shazzzam](https://github.com/shazzzam)! - Surface ICP neuron staking entry points on mobile: Stake and Manage Neurons account-header actions,
  gated behind the new `llmIcpStaking` feature flag. The StakingFlow and NeuronManageFlow navigators
  are registered as stubs and their screens land separately.

- [#20650](https://github.com/LedgerHQ/ledger-live/pull/20650) [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add a gRPC-web transport to the Sui coin module

  - `coin-sui` gains a third transport on `sui.rpc.v2` over gRPC-web, covering every capability from
    checkpoints to device signing.
  - New tri-state `suiTransport` feature flag (`json` | `grpc` | `graphql`), defaulting to `json`,
    replaces the boolean `suiGraphqlTransport`, which is removed. An unrecognised value resolves to
    `json`.
  - New env vars `API_SUI_GRPC_PROXY` and `API_SUI_TESTNET_GRPC_PROXY`. `@mysten/sui` 2.9.0 → 2.23.1.
  - Operation `blockHash` carries the real checkpoint digest on gRPC.
  - Fix: account sync read a single page of history on GraphQL and gRPC, capping an account at its
    newest 50 operations for good — sync resumes from the newest stored operation and never re-reads
    what it skipped. Both arms now walk up to `TRANSACTIONS_LIMIT` (300), the depth JSON-RPC reached.
  - Fix: a resumed sync on GraphQL and gRPC read backwards from the tip, so when more than
    `TRANSACTIONS_LIMIT` transactions arrived between two syncs, the ones in the middle were skipped
    and the next sync resumed above them — a permanent hole. Both arms now walk forward from the
    cursor, as the JSON-RPC arm already did, leaving anything unread newer than the next resume point.
  - Fix: an account holding no operations resumed from its stored `syncHash`, so a cleared cache came
    back with only the transactions that arrived after it. Such an account now re-reads its history,
    which is also how one truncated by the bug above recovers. Token operations count as history: they
    live in the subaccounts, so a token-only account is no longer treated as empty.
  - Fix: on gRPC, any failure to resolve a cursor's digest — including a transient network error — was
    read as "unknown digest", which falls back to an unbounded page from the tip and made paging report
    the end of history. Only a `NOT_FOUND` does that now; everything else propagates and is retried.
  - Fix: reading history skipped transactions that shared a checkpoint with the resume point, in
    account sync (`getOperations`) as well as paging (`getListOperations`).
  - Fix: paging inferred "more to come" from how many operations survived client-side filtering, which
    ended the walk early. GraphQL now reads `pageInfo`, gRPC the stream's `QueryEnd` reason. A page
    whose transactions were all filtered out now resumes from the page's own boundary instead of
    reporting the end of history.
  - Fix: a gRPC history record with no timestamp became an operation dated 1970 that could not serve as
    a pagination cursor. Those records are now dropped, as the GraphQL arm already did.
  - Fix: ascending paging on GraphQL returned the newest slice of the range instead of walking forward
    from the oldest.
  - Fix: the Sui fetcher dropped `X-Ledger-Client-Version` and all gRPC-web headers when passed a
    `Headers` instance.
  - Fix: GraphQL resolved the latest checkpoint in two queries, so the second could answer null. It is
    now one query.
  - A checkpoint missing its `digest` or `timestamp` now raises on both GraphQL and gRPC, instead of
    reporting a block with an empty hash and a 1970 timestamp.
  - Known limitation: `getListOperations` resumes from a synthesised `timestamp:digest` cursor, so
    within one checkpoint a sibling whose digest sorts earlier can be skipped, and a checkpoint holding
    more than one page is stepped over rather than resumed inside. Account sync is unaffected: it
    resumes from the server's own watermark cursor.

## 6.120.0

### Minor Changes

- [#20907](https://github.com/LedgerHQ/ledger-live/pull/20907) [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

- [#20719](https://github.com/LedgerHQ/ledger-live/pull/20719) [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15) Thanks [@sarneijim](https://github.com/sarneijim)! - Drive desktop LNS upsell banners from `largeScreenUpsell` and remove the legacy `lldNanoSUpsellBanners` flag (LIVE-35487).

- [#20630](https://github.com/LedgerHQ/ledger-live/pull/20630) [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c) Thanks [@sarneijim](https://github.com/sarneijim)! - Enable LNS upsell portfolio banner for opted-in users (LIVE-32086).

## 6.120.0-next.1

### Minor Changes

- [#20907](https://github.com/LedgerHQ/ledger-live/pull/20907) [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

## 6.120.0-next.0

### Minor Changes

- [#20719](https://github.com/LedgerHQ/ledger-live/pull/20719) [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15) Thanks [@sarneijim](https://github.com/sarneijim)! - Drive desktop LNS upsell banners from `largeScreenUpsell` and remove the legacy `lldNanoSUpsellBanners` flag (LIVE-35487).

- [#20630](https://github.com/LedgerHQ/ledger-live/pull/20630) [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c) Thanks [@sarneijim](https://github.com/sarneijim)! - Enable LNS upsell portfolio banner for opted-in users (LIVE-32086).

## 6.119.0

### Minor Changes

- [#20207](https://github.com/LedgerHQ/ledger-live/pull/20207) [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add Internet Computer (ICP) neuron staking to the coin module: create and top up neurons, start/stop dissolving, disburse, set/increase dissolve delay, follow, split, spawn, stake maturity, and add/remove hot keys, plus neuron listing. Governance operations are routed through the NNS governance canister via the device's update-call signing, alongside the existing ledger transfer path, and account synchronization now carries neuron data. Adds the `STAKE_NEURON` and `TOP_UP_NEURON` operation types, with matching icons and labels in the desktop and mobile operation history. (LIVE-28469)

- [#20574](https://github.com/LedgerHQ/ledger-live/pull/20574) [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move these packages from `libs/ledgerjs/packages/` up to `libs/`. The remaining LedgerJS packages stay in place until they are extracted to the ts-libs repository.

- [#20430](https://github.com/LedgerHQ/ledger-live/pull/20430) [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the recent-addresses domain model and in-memory store into `@domain/entity-recent-addresses`

  `RecentAddress` and `RecentAddressesState` are no longer declared in `@ledgerhq/types-live`; they are now inferred from the Zod schemas in `@domain/entity-recent-addresses`, which also owns `RecentAddressesStore`, `setupRecentAddressesStore` and `getRecentAddressesStore`. Import them from `@domain/entity-recent-addresses`.

  `@ledgerhq/live-common/account/index` still re-exports the store API unchanged, minus the `RecentAddressesCache` alias — use `RecentAddressesState` instead.

  Also fixes the store mutating its own state in place: once a first mutation had been dispatched, immer had frozen that exact object graph, so the next `addAddress` or `removeAddress` on the same currency threw `TypeError: Cannot assign to read only property`. The store now replaces its state instead of mutating it.

- [#19645](https://github.com/LedgerHQ/ledger-live/pull/19645) [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152) Thanks [@amaslakov](https://github.com/amaslakov)! - Add an optional `readiness` attribute to the base `Account` type (`{ ready: boolean; reason?: string }`), a generic cross-chain projection of whether an account is fully operational. It is persisted through account serialization and populated during sync via a new optional `BridgeApi.getAccountReadiness` hook. Tezos implements the hook: an account whose public key is not revealed on-chain is reported as `{ ready: false, reason: "unrevealed" }`. Families that do not provide the hook leave `readiness` undefined. coin-tezos `getAccountByAddress` now coalesces concurrent same-address calls into a single request, so surfacing readiness during sync adds no redundant tzkt call.

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
