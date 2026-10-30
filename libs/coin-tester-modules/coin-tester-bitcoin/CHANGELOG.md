# @ledgerhq/coin-tester-bitcoin

## 1.15.0-next.1

### Patch Changes

- Updated dependencies [[`5b7bcf7`](https://github.com/LedgerHQ/ledger-live/commit/5b7bcf7b75d380d098eb990220383a02103e4319)]:
  - @ledgerhq/live-common@38.5.0-next.1

## 1.15.0-next.0

### Minor Changes

- [#23047](https://github.com/LedgerHQ/ledger-live/pull/23047) [`95fb249`](https://github.com/LedgerHQ/ledger-live/commit/95fb249c5f08f7a3602a210bfcbf89e19c988a8b) Thanks [@qperrot](https://github.com/qperrot)! - test(coin-tester-bitcoin): run a send scenario through coin-bitcoin's alpaca api with the generic coin framework

- [#23659](https://github.com/LedgerHQ/ledger-live/pull/23659) [`2a56df0`](https://github.com/LedgerHQ/ledger-live/commit/2a56df0d21a515958dbf18e652fe1ed0e594736e) Thanks [@qperrot](https://github.com/qperrot)! - Run the Bitcoin deterministic tester on coin-sandbox: the regtest node and Atlas are started through its `up` and funded by its airdrop, instead of the tester's own docker-compose, which is removed with the `docker-compose` dependency

  The coin-tester awaits a transaction's `expect` when it returns a promise, so the next transaction and the last sync wait for it, and its failed assertions fail the scenario

### Patch Changes

- Updated dependencies [[`7077a0a`](https://github.com/LedgerHQ/ledger-live/commit/7077a0ac3e17ba9922562ca286232bd7c475a4f4), [`4883e43`](https://github.com/LedgerHQ/ledger-live/commit/4883e4316f186755d65348e6648cbc846c62f2bf), [`54fd19d`](https://github.com/LedgerHQ/ledger-live/commit/54fd19d8fc32c8aa886afca9e750db5163ce20e6), [`2f49d10`](https://github.com/LedgerHQ/ledger-live/commit/2f49d10deab5f44e7468ffdc4577f0804235824c), [`605f361`](https://github.com/LedgerHQ/ledger-live/commit/605f361c7af36373d28dd7c5020bcfd9fa1ee21c), [`d94b2e8`](https://github.com/LedgerHQ/ledger-live/commit/d94b2e8643c76f4b231b5cb21184ac76a3bdff15), [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2), [`e3e0f3a`](https://github.com/LedgerHQ/ledger-live/commit/e3e0f3a5fefbdcf08c8c16d7dc2a3d9f6a6922e0), [`c43b0f9`](https://github.com/LedgerHQ/ledger-live/commit/c43b0f9ff55c39a5a137e210949419263207d322), [`fd6a3a3`](https://github.com/LedgerHQ/ledger-live/commit/fd6a3a341b07baa2849a9e79e3a05b73863034b7), [`4e9e4f6`](https://github.com/LedgerHQ/ledger-live/commit/4e9e4f65f4a8c22ebcb270a8886c50ebe289c705), [`cdfa0c9`](https://github.com/LedgerHQ/ledger-live/commit/cdfa0c93d31ebdefdbc6bfc5f8deee7135623a3e), [`e8f69f6`](https://github.com/LedgerHQ/ledger-live/commit/e8f69f6cecfb104cddd8438ca6fcbd8995f1d488), [`d37d80e`](https://github.com/LedgerHQ/ledger-live/commit/d37d80e128d89fcd80630fd4ef13c66587e3bebe), [`dd056b8`](https://github.com/LedgerHQ/ledger-live/commit/dd056b8a4c6c7c28879cfb1c44139b2479281987), [`95fb249`](https://github.com/LedgerHQ/ledger-live/commit/95fb249c5f08f7a3602a210bfcbf89e19c988a8b), [`2a56df0`](https://github.com/LedgerHQ/ledger-live/commit/2a56df0d21a515958dbf18e652fe1ed0e594736e), [`c4b7982`](https://github.com/LedgerHQ/ledger-live/commit/c4b79825af9468fbb8f5325e77e47536d6b392e9), [`5b1443e`](https://github.com/LedgerHQ/ledger-live/commit/5b1443e8dd056a5c7c0d34a82abb0b1b5ff8d5a0), [`dbaf56d`](https://github.com/LedgerHQ/ledger-live/commit/dbaf56ddb47f5a43221feba193700cf40f4a46df), [`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1), [`07a548b`](https://github.com/LedgerHQ/ledger-live/commit/07a548bb67cfd5dff60f4554bfdfd386856e97e9), [`d4be6b6`](https://github.com/LedgerHQ/ledger-live/commit/d4be6b620102f2c9f65201935646d32cb365f6ac), [`01ed754`](https://github.com/LedgerHQ/ledger-live/commit/01ed754cd80959b8e9ec3d73a02b1b8d5289e0be), [`4a5b346`](https://github.com/LedgerHQ/ledger-live/commit/4a5b346480bff9d945274149cca8ed1175cc30eb), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359), [`9fcce41`](https://github.com/LedgerHQ/ledger-live/commit/9fcce4124460578380778520016adccaf576980d), [`6ea7918`](https://github.com/LedgerHQ/ledger-live/commit/6ea791860eef5b92cc6041ba171e8846e88ef2c8), [`e647907`](https://github.com/LedgerHQ/ledger-live/commit/e647907efc9ef15a3bba21ec5acdbbe6cbae658a), [`4583067`](https://github.com/LedgerHQ/ledger-live/commit/4583067f4eca55d70079fa6347b21c48f304bf54), [`a389665`](https://github.com/LedgerHQ/ledger-live/commit/a389665d6256a750f539ec54516f667cca1fb011), [`750d4bf`](https://github.com/LedgerHQ/ledger-live/commit/750d4bf2f8c70aa114e98222e25770a9a2cdfa70), [`0240a0c`](https://github.com/LedgerHQ/ledger-live/commit/0240a0c9a069f895516199995483af5f12993277), [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b), [`5ef3bbd`](https://github.com/LedgerHQ/ledger-live/commit/5ef3bbd09001975fcbfc21dfd283495e74c9e70a), [`6ef743c`](https://github.com/LedgerHQ/ledger-live/commit/6ef743cbd058ce0a43363d01b6dadc0f2674a8e3), [`ffd02a9`](https://github.com/LedgerHQ/ledger-live/commit/ffd02a95c452560d606ad30588f15ff5d2182763), [`2929c6e`](https://github.com/LedgerHQ/ledger-live/commit/2929c6ebe1647bb011d37ebe3f6bd7a920045754), [`4031174`](https://github.com/LedgerHQ/ledger-live/commit/40311746f2633cf914b42999781266e64d54dc7c)]:
  - @ledgerhq/live-common@38.5.0-next.0
  - @ledgerhq/coin-bitcoin@1.1.0-next.0
  - @ledgerhq/hw-app-btc@12.1.0-next.0
  - @ledgerhq/coin-tester@0.21.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.9.0-next.0
  - @ledgerhq/types-live@6.129.0-next.0

## 1.14.0

### Minor Changes

- [#23108](https://github.com/LedgerHQ/ledger-live/pull/23108) [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@noble/curves` to 2.4.0 (ESM-only), use the `.js` subpaths and pass `prehash: false` where a digest is signed or verified. CommonJS consumers of `@ledgerhq/hw-app-btc` and `@ledgerhq/wallet-btc` now need Node >= 20.19 (synchronous `require(esm)`) or an ESM-capable bundler.

### Patch Changes

- Updated dependencies [[`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d), [`7b3040a`](https://github.com/LedgerHQ/ledger-live/commit/7b3040ad872c183fd2beb81a965037b5310ab87a), [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068), [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/coin-bitcoin@1.0.0
  - @ledgerhq/hw-app-btc@12.0.0
  - @ledgerhq/ledger-wallet-framework@3.8.0
  - @ledgerhq/types-live@6.128.0
  - @ledgerhq/coin-tester@0.20.0

## 1.14.0-next.0

### Minor Changes

- [#23108](https://github.com/LedgerHQ/ledger-live/pull/23108) [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@noble/curves` to 2.4.0 (ESM-only), use the `.js` subpaths and pass `prehash: false` where a digest is signed or verified. CommonJS consumers of `@ledgerhq/hw-app-btc` and `@ledgerhq/wallet-btc` now need Node >= 20.19 (synchronous `require(esm)`) or an ESM-capable bundler.

### Patch Changes

- Updated dependencies [[`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d), [`7b3040a`](https://github.com/LedgerHQ/ledger-live/commit/7b3040ad872c183fd2beb81a965037b5310ab87a), [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068), [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/coin-bitcoin@1.0.0-next.0
  - @ledgerhq/hw-app-btc@12.0.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.8.0-next.0
  - @ledgerhq/types-live@6.128.0-next.0
  - @ledgerhq/coin-tester@0.20.0

## 1.13.0

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

### Patch Changes

- Updated dependencies [[`d6e7695`](https://github.com/LedgerHQ/ledger-live/commit/d6e7695bf15852c7b0cd2a97aa0a3a0c4d047d74), [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/coin-bitcoin@0.55.0
  - @ledgerhq/ledger-wallet-framework@3.7.0
  - @ledgerhq/types-live@6.127.0
  - @ledgerhq/coin-tester@0.20.0
  - @ledgerhq/hw-app-btc@11.6.0

## 1.13.0-next.1

### Patch Changes

- Updated dependencies [[`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.1
  - @ledgerhq/coin-bitcoin@0.55.0-next.1

## 1.13.0-next.0

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

### Patch Changes

- Updated dependencies [[`d6e7695`](https://github.com/LedgerHQ/ledger-live/commit/d6e7695bf15852c7b0cd2a97aa0a3a0c4d047d74), [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/coin-bitcoin@0.55.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.0
  - @ledgerhq/types-live@6.127.0-next.0
  - @ledgerhq/coin-tester@0.20.0
  - @ledgerhq/hw-app-btc@11.6.0

## 1.12.9

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d), [`62cc42f`](https://github.com/LedgerHQ/ledger-live/commit/62cc42f32d041e0e1081e7fdaca04169581429ec)]:
  - @ledgerhq/types-live@6.126.0
  - @ledgerhq/ledger-wallet-framework@3.6.0
  - @ledgerhq/coin-bitcoin@0.54.0
  - @ledgerhq/coin-tester@0.20.0

## 1.12.9-next.0

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d), [`62cc42f`](https://github.com/LedgerHQ/ledger-live/commit/62cc42f32d041e0e1081e7fdaca04169581429ec)]:
  - @ledgerhq/types-live@6.126.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.6.0-next.0
  - @ledgerhq/coin-bitcoin@0.54.0-next.0
  - @ledgerhq/coin-tester@0.20.0

## 1.12.8

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`29ce771`](https://github.com/LedgerHQ/ledger-live/commit/29ce7712ce93cd27afa97eda2d14a0ff066551fb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/coin-bitcoin@0.53.0
  - @ledgerhq/hw-app-btc@11.6.0
  - @ledgerhq/ledger-wallet-framework@3.5.0
  - @ledgerhq/types-live@6.125.0
  - @ledgerhq/coin-tester@0.20.0

## 1.12.8-next.0

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`29ce771`](https://github.com/LedgerHQ/ledger-live/commit/29ce7712ce93cd27afa97eda2d14a0ff066551fb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/coin-bitcoin@0.53.0-next.0
  - @ledgerhq/hw-app-btc@11.6.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.5.0-next.0
  - @ledgerhq/types-live@6.125.0-next.0
  - @ledgerhq/coin-tester@0.20.0

## 1.12.7

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0
  - @ledgerhq/hw-app-btc@11.5.0
  - @ledgerhq/ledger-wallet-framework@3.4.0
  - @ledgerhq/coin-bitcoin@0.52.1
  - @ledgerhq/coin-tester@0.20.0

## 1.12.7-next.0

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0-next.0
  - @ledgerhq/hw-app-btc@11.5.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.4.0-next.0
  - @ledgerhq/coin-bitcoin@0.52.1-next.0
  - @ledgerhq/coin-tester@0.20.0

## 1.12.6

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`0152cad`](https://github.com/LedgerHQ/ledger-live/commit/0152cade87e061bb2b56fd71f8a404c3dfed21e0), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0
  - @ledgerhq/ledger-wallet-framework@3.3.0
  - @ledgerhq/coin-bitcoin@0.52.0
  - @ledgerhq/coin-tester@0.20.0

## 1.12.6-next.0

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`0152cad`](https://github.com/LedgerHQ/ledger-live/commit/0152cade87e061bb2b56fd71f8a404c3dfed21e0), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.3.0-next.0
  - @ledgerhq/coin-bitcoin@0.52.0-next.0
  - @ledgerhq/coin-tester@0.20.0

## 1.12.5

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682)]:
  - @ledgerhq/types-live@6.122.0
  - @ledgerhq/ledger-wallet-framework@3.2.0
  - @ledgerhq/coin-bitcoin@0.51.3
  - @ledgerhq/coin-tester@0.20.0

## 1.12.5-next.0

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682)]:
  - @ledgerhq/types-live@6.122.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.2.0-next.0
  - @ledgerhq/coin-bitcoin@0.51.3-next.0
  - @ledgerhq/coin-tester@0.20.0

## 1.12.4

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e)]:
  - @ledgerhq/types-live@6.121.0
  - @ledgerhq/ledger-wallet-framework@3.1.0
  - @ledgerhq/coin-bitcoin@0.51.2
  - @ledgerhq/coin-tester@0.20.0

## 1.12.4-next.0

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e)]:
  - @ledgerhq/types-live@6.121.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.1.0-next.0
  - @ledgerhq/coin-bitcoin@0.51.2-next.0
  - @ledgerhq/coin-tester@0.20.0

## 1.12.3

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6), [`d0e69c2`](https://github.com/LedgerHQ/ledger-live/commit/d0e69c28bdba14725ef5efce73deedb49062eb79)]:
  - @ledgerhq/types-live@6.120.0
  - @ledgerhq/ledger-wallet-framework@3.0.0
  - @ledgerhq/hw-app-btc@11.4.0
  - @ledgerhq/coin-bitcoin@0.51.1
  - @ledgerhq/coin-tester@0.20.0

## 1.12.3-next.1

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @ledgerhq/types-live@6.120.0-next.1
  - @ledgerhq/coin-bitcoin@0.51.1-next.1
  - @ledgerhq/coin-tester@0.20.0
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.1

## 1.12.3-next.0

### Patch Changes

- Updated dependencies [[`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6), [`d0e69c2`](https://github.com/LedgerHQ/ledger-live/commit/d0e69c28bdba14725ef5efce73deedb49062eb79)]:
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.0
  - @ledgerhq/types-live@6.120.0-next.0
  - @ledgerhq/hw-app-btc@11.4.0-next.0
  - @ledgerhq/coin-bitcoin@0.51.1-next.0
  - @ledgerhq/coin-tester@0.20.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
