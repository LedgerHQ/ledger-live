# @ledgerhq/coin-zcash

## 1.0.0

### Major Changes

- [#22964](https://github.com/LedgerHQ/ledger-live/pull/22964) [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(wallet-btc): inject `logger` instead of using `@ledgerhq/logs`

### Minor Changes

- [#23343](https://github.com/LedgerHQ/ledger-live/pull/23343) [`9365d3a`](https://github.com/LedgerHQ/ledger-live/commit/9365d3ad499ac5c80d445e7816c30adbfe05ffd8) Thanks [@cted-ledger](https://github.com/cted-ledger)! - take the zcash network from the account's currency instead of the zaino url, and pass it to the device signer for transparent sends; the viewing-key export keeps the testnet coin type (1') instead of rejecting it

- [#23215](https://github.com/LedgerHQ/ledger-live/pull/23215) [`ef80ee4`](https://github.com/LedgerHQ/ledger-live/commit/ef80ee46eb564e25090ce08d8459212739158117) Thanks [@cted-ledger](https://github.com/cted-ledger)! - add a transparent-only mode to the zcash bridge, for hosts that do not run the shielded engine

- [#23324](https://github.com/LedgerHQ/ledger-live/pull/23324) [`6b23210`](https://github.com/LedgerHQ/ledger-live/commit/6b232105c11b8b8b86fcb6a715ef19a0b3453b74) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Select the Zcash fee per logical action from the account's synced height and network (ZIP 2009): 1,000 zatoshis from mainnet height 3,590,000 (applied 100 blocks late) and on test networks, 5,000 before. Bump `@ledgerhq/zcash-utils` to 2.7.0. The mainnet switch height can be delayed or the switch disabled through the optional `zip2009.mainnetHeight` coin-config setting (`null` disables it); a height below 3,590,000 is raised to it.

- [#23390](https://github.com/LedgerHQ/ledger-live/pull/23390) [`6582ee6`](https://github.com/LedgerHQ/ledger-live/commit/6582ee63c343dd6f64a31068fddd038af4eb9bd2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Sign Nano S transparent Zcash sends through the legacy device path when the shielded engine is on, with the inputs and fee shown at review.

- [#23108](https://github.com/LedgerHQ/ledger-live/pull/23108) [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@noble/curves` to 2.4.0 (ESM-only), use the `.js` subpaths and pass `prehash: false` where a digest is signed or verified. CommonJS consumers of `@ledgerhq/hw-app-btc` and `@ledgerhq/wallet-btc` now need Node >= 20.19 (synchronous `require(esm)`) or an ESM-capable bundler.

### Patch Changes

- Updated dependencies [[`9365d3a`](https://github.com/LedgerHQ/ledger-live/commit/9365d3ad499ac5c80d445e7816c30adbfe05ffd8), [`e505c53`](https://github.com/LedgerHQ/ledger-live/commit/e505c537cafd5f44999f201cfe0a773a90cf5671), [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068), [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/live-signer-zcash@0.11.0
  - @ledgerhq/hw-app-btc@12.0.0
  - @ledgerhq/wallet-btc@1.0.0
  - @ledgerhq/ledger-wallet-framework@3.8.0
  - @ledgerhq/types-live@6.128.0

## 1.0.0-next.1

### Patch Changes

- Updated dependencies [[`e505c53`](https://github.com/LedgerHQ/ledger-live/commit/e505c537cafd5f44999f201cfe0a773a90cf5671)]:
  - @ledgerhq/live-signer-zcash@0.11.0-next.1

## 1.0.0-next.0

### Major Changes

- [#22964](https://github.com/LedgerHQ/ledger-live/pull/22964) [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(wallet-btc): inject `logger` instead of using `@ledgerhq/logs`

### Minor Changes

- [#23343](https://github.com/LedgerHQ/ledger-live/pull/23343) [`9365d3a`](https://github.com/LedgerHQ/ledger-live/commit/9365d3ad499ac5c80d445e7816c30adbfe05ffd8) Thanks [@cted-ledger](https://github.com/cted-ledger)! - take the zcash network from the account's currency instead of the zaino url, and pass it to the device signer for transparent sends; the viewing-key export keeps the testnet coin type (1') instead of rejecting it

- [#23215](https://github.com/LedgerHQ/ledger-live/pull/23215) [`ef80ee4`](https://github.com/LedgerHQ/ledger-live/commit/ef80ee46eb564e25090ce08d8459212739158117) Thanks [@cted-ledger](https://github.com/cted-ledger)! - add a transparent-only mode to the zcash bridge, for hosts that do not run the shielded engine

- [#23324](https://github.com/LedgerHQ/ledger-live/pull/23324) [`6b23210`](https://github.com/LedgerHQ/ledger-live/commit/6b232105c11b8b8b86fcb6a715ef19a0b3453b74) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Select the Zcash fee per logical action from the account's synced height and network (ZIP 2009): 1,000 zatoshis from mainnet height 3,590,000 (applied 100 blocks late) and on test networks, 5,000 before. Bump `@ledgerhq/zcash-utils` to 2.7.0. The mainnet switch height can be delayed or the switch disabled through the optional `zip2009.mainnetHeight` coin-config setting (`null` disables it); a height below 3,590,000 is raised to it.

- [#23390](https://github.com/LedgerHQ/ledger-live/pull/23390) [`6582ee6`](https://github.com/LedgerHQ/ledger-live/commit/6582ee63c343dd6f64a31068fddd038af4eb9bd2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Sign Nano S transparent Zcash sends through the legacy device path when the shielded engine is on, with the inputs and fee shown at review.

- [#23108](https://github.com/LedgerHQ/ledger-live/pull/23108) [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@noble/curves` to 2.4.0 (ESM-only), use the `.js` subpaths and pass `prehash: false` where a digest is signed or verified. CommonJS consumers of `@ledgerhq/hw-app-btc` and `@ledgerhq/wallet-btc` now need Node >= 20.19 (synchronous `require(esm)`) or an ESM-capable bundler.

### Patch Changes

- Updated dependencies [[`9365d3a`](https://github.com/LedgerHQ/ledger-live/commit/9365d3ad499ac5c80d445e7816c30adbfe05ffd8), [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068), [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/live-signer-zcash@0.11.0-next.0
  - @ledgerhq/hw-app-btc@12.0.0-next.0
  - @ledgerhq/wallet-btc@1.0.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.8.0-next.0
  - @ledgerhq/types-live@6.128.0-next.0

## 0.11.0

### Minor Changes

- [#23189](https://github.com/LedgerHQ/ledger-live/pull/23189) [`3f4e740`](https://github.com/LedgerHQ/ledger-live/commit/3f4e7409bfc66544165598c23cbc826001632f16) Thanks [@cted-ledger](https://github.com/cted-ledger)! - validate and classify zcash recipients per network, mainnet or testnet, and reject a transparent recipient with a bad checksum in the transaction status

- [#22781](https://github.com/LedgerHQ/ledger-live/pull/22781) [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1) Thanks [@KVNLS](https://github.com/KVNLS)! - Build the desktop renderer as a web target instead of `electron-renderer`: Node builtins resolve at build time rather than as runtime `require()` calls, and the bundle has no externals. `process` reads are supplied from a snapshot captured in main at startup, deliberately not a `process/browser` polyfill, which would report `platform === "browser"`. A build-time guard fails the build on an unguarded `process` read or a bare `setImmediate`/`clearImmediate`, rather than letting it surface as a runtime crash.

  ZCash shielded sync receives its IPC channel through `setZCashIpcRenderer` instead of reaching for `electron`; the desktop app supplies it over the preload bridge.

  `@ledgerhq/transaction-observability` (the dApp intent's `app_version`) and `@features/platform-device-action-content` (the E2E animation switch) read `process.env` directly instead of `globalThis.process`, which the web-target renderer does not have.

### Patch Changes

- Updated dependencies [[`6e3211f`](https://github.com/LedgerHQ/ledger-live/commit/6e3211f6c887211d4ecfbf58d909f49c31df6179), [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/wallet-btc@0.7.0
  - @ledgerhq/ledger-wallet-framework@3.7.0
  - @ledgerhq/types-live@6.127.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.11.0-next.1

### Patch Changes

- Updated dependencies [[`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.1
  - @ledgerhq/wallet-btc@0.7.0-next.0

## 0.11.0-next.0

### Minor Changes

- [#23189](https://github.com/LedgerHQ/ledger-live/pull/23189) [`3f4e740`](https://github.com/LedgerHQ/ledger-live/commit/3f4e7409bfc66544165598c23cbc826001632f16) Thanks [@cted-ledger](https://github.com/cted-ledger)! - validate and classify zcash recipients per network, mainnet or testnet, and reject a transparent recipient with a bad checksum in the transaction status

- [#22781](https://github.com/LedgerHQ/ledger-live/pull/22781) [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1) Thanks [@KVNLS](https://github.com/KVNLS)! - Build the desktop renderer as a web target instead of `electron-renderer`: Node builtins resolve at build time rather than as runtime `require()` calls, and the bundle has no externals. `process` reads are supplied from a snapshot captured in main at startup, deliberately not a `process/browser` polyfill, which would report `platform === "browser"`. A build-time guard fails the build on an unguarded `process` read or a bare `setImmediate`/`clearImmediate`, rather than letting it surface as a runtime crash.

  ZCash shielded sync receives its IPC channel through `setZCashIpcRenderer` instead of reaching for `electron`; the desktop app supplies it over the preload bridge.

  `@ledgerhq/transaction-observability` (the dApp intent's `app_version`) and `@features/platform-device-action-content` (the E2E animation switch) read `process.env` directly instead of `globalThis.process`, which the web-target renderer does not have.

### Patch Changes

- Updated dependencies [[`6e3211f`](https://github.com/LedgerHQ/ledger-live/commit/6e3211f6c887211d4ecfbf58d909f49c31df6179), [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/wallet-btc@0.7.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.0
  - @ledgerhq/types-live@6.127.0-next.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.10.0

### Minor Changes

- [#22561](https://github.com/LedgerHQ/ledger-live/pull/22561) [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae) Thanks [@YazhuEth](https://github.com/YazhuEth)! - chore(currency): drop `CryptoCurrency#bitcoinLikeInfo`

  coin-bitcoin now reads the xpub version from its own `getNetworkParameters`, and coin-zcash from a local `ZCASH_XPUB_VERSION` constant. The unused `bitcoinLikeInfo` field (and `BitcoinLikeInfoSchema`) is removed from the currency types and registry.

- [#21953](https://github.com/LedgerHQ/ledger-live/pull/21953) [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/live-config`, `@ledgerhq/live-env`, `@ledgerhq/live-currency-format`,
  `@ledgerhq/domain-service` and `@ledgerhq/evm-tools` from npm instead of the workspace — they
  now live in the `ts-libs` repository. No API change.

- [#22589](https://github.com/LedgerHQ/ledger-live/pull/22589) [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5) Thanks [@qperrot](https://github.com/qperrot)! - Remove the deprecated `CryptoCurrency.explorerId` field and the `LedgerExplorerId` type.

  Bitcoin-like explorer ids now come from the coin config (`config_currency_<id>.explorerId`), as EVM already does, and fall back to the currency id. The config is passed in rather than read from a module global: `toWalletBtcCurrency`, `walletBtcCurrencyById` and coin-bitcoin's `blockchainBaseURL` take it as an argument, the sync functions take the `coinConfig` resolver given to `createBridges`, and `assignFromAccountRaw` is now built with `makeAssignFromAccountRaw(coinConfig)`.

  Adds `config_currency_bitcoin_testnet`, `config_currency_bitcoin_regtest` and `config_currency_zcash_regtest` so every bitcoin-like currency resolves a config entry.

- [#22542](https://github.com/LedgerHQ/ledger-live/pull/22542) [`06c71d1`](https://github.com/LedgerHQ/ledger-live/commit/06c71d101fb664b50202f6ddc09dd1abbcb76a3a) Thanks [@cted-ledger](https://github.com/cted-ledger)! - fix(coin-zcash): read endpoints and sync limits from the injected coin config

  The module no longer keeps configuration in module state. `createBridges` takes a `Context`
  (ADR-019) and sync, sign and broadcast resolve `config_currency_zcash` from `context.config()` on
  every call. The endpoints `zaino.url` and `explorer.url` are required and default to the production
  hosts in `config_currency_zcash`; the mainnet Zaino default no longer points at staging. The
  optional tuning fields `zaino.timeoutMs` (per-chunk budget of the automatic shielded sync) and
  `zaino.batchSize` (blocks per shielded scan chunk) fall back to the module defaults
  `ZCASH_SHIELDED_CHUNK_TIMEOUT_MS` (120000) and `ZCASH_SHIELDED_BATCH_SIZE` (5000). All of them can
  be changed through the remote currency config without a release. The explorer (`explorer.url` and
  the optional `explorerId`) is bound from the config at use, so deserialization stays config-free.

  Breaking: `createBridges(signerContext, context)` takes a `Context` instead of a config getter;
  `setCoinConfig`, `getCoinConfig`, `setZainoGrpcUrl`, the `ZCASH_GRPC_URL_*` and
  `ZCASH_AUTO_SYNC_TIMEOUT_MS` constants and the `ZcashConfigInfo` type are removed in favour of
  `ZcashCoinConfig` / `ZcashContext`.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d)]:
  - @ledgerhq/types-live@6.126.0
  - @ledgerhq/ledger-wallet-framework@3.6.0
  - @ledgerhq/live-signer-zcash@0.10.0
  - @ledgerhq/wallet-btc@0.6.0

## 0.10.0-next.0

### Minor Changes

- [#22561](https://github.com/LedgerHQ/ledger-live/pull/22561) [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae) Thanks [@YazhuEth](https://github.com/YazhuEth)! - chore(currency): drop `CryptoCurrency#bitcoinLikeInfo`

  coin-bitcoin now reads the xpub version from its own `getNetworkParameters`, and coin-zcash from a local `ZCASH_XPUB_VERSION` constant. The unused `bitcoinLikeInfo` field (and `BitcoinLikeInfoSchema`) is removed from the currency types and registry.

- [#21953](https://github.com/LedgerHQ/ledger-live/pull/21953) [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/live-config`, `@ledgerhq/live-env`, `@ledgerhq/live-currency-format`,
  `@ledgerhq/domain-service` and `@ledgerhq/evm-tools` from npm instead of the workspace — they
  now live in the `ts-libs` repository. No API change.

- [#22589](https://github.com/LedgerHQ/ledger-live/pull/22589) [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5) Thanks [@qperrot](https://github.com/qperrot)! - Remove the deprecated `CryptoCurrency.explorerId` field and the `LedgerExplorerId` type.

  Bitcoin-like explorer ids now come from the coin config (`config_currency_<id>.explorerId`), as EVM already does, and fall back to the currency id. The config is passed in rather than read from a module global: `toWalletBtcCurrency`, `walletBtcCurrencyById` and coin-bitcoin's `blockchainBaseURL` take it as an argument, the sync functions take the `coinConfig` resolver given to `createBridges`, and `assignFromAccountRaw` is now built with `makeAssignFromAccountRaw(coinConfig)`.

  Adds `config_currency_bitcoin_testnet`, `config_currency_bitcoin_regtest` and `config_currency_zcash_regtest` so every bitcoin-like currency resolves a config entry.

- [#22542](https://github.com/LedgerHQ/ledger-live/pull/22542) [`06c71d1`](https://github.com/LedgerHQ/ledger-live/commit/06c71d101fb664b50202f6ddc09dd1abbcb76a3a) Thanks [@cted-ledger](https://github.com/cted-ledger)! - fix(coin-zcash): read endpoints and sync limits from the injected coin config

  The module no longer keeps configuration in module state. `createBridges` takes a `Context`
  (ADR-019) and sync, sign and broadcast resolve `config_currency_zcash` from `context.config()` on
  every call. The endpoints `zaino.url` and `explorer.url` are required and default to the production
  hosts in `config_currency_zcash`; the mainnet Zaino default no longer points at staging. The
  optional tuning fields `zaino.timeoutMs` (per-chunk budget of the automatic shielded sync) and
  `zaino.batchSize` (blocks per shielded scan chunk) fall back to the module defaults
  `ZCASH_SHIELDED_CHUNK_TIMEOUT_MS` (120000) and `ZCASH_SHIELDED_BATCH_SIZE` (5000). All of them can
  be changed through the remote currency config without a release. The explorer (`explorer.url` and
  the optional `explorerId`) is bound from the config at use, so deserialization stays config-free.

  Breaking: `createBridges(signerContext, context)` takes a `Context` instead of a config getter;
  `setCoinConfig`, `getCoinConfig`, `setZainoGrpcUrl`, the `ZCASH_GRPC_URL_*` and
  `ZCASH_AUTO_SYNC_TIMEOUT_MS` constants and the `ZcashConfigInfo` type are removed in favour of
  `ZcashCoinConfig` / `ZcashContext`.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d)]:
  - @ledgerhq/types-live@6.126.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.6.0-next.0
  - @ledgerhq/live-signer-zcash@0.10.0
  - @ledgerhq/wallet-btc@0.6.0

## 0.9.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

- [#22064](https://github.com/LedgerHQ/ledger-live/pull/22064) [`d1d0d90`](https://github.com/LedgerHQ/ledger-live/commit/d1d0d90e75648ae1127b5682a6244b8e8268550a) Thanks [@semeano](https://github.com/semeano)! - Show a Zcash shielding transaction as private and display its shielded destination instead of its transparent change, masking that destination under discreet mode

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`29ce771`](https://github.com/LedgerHQ/ledger-live/commit/29ce7712ce93cd27afa97eda2d14a0ff066551fb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/ledger-wallet-framework@3.5.0
  - @ledgerhq/types-live@6.125.0
  - @ledgerhq/live-env@4.1.0
  - @ledgerhq/wallet-btc@0.6.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.9.0-next.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

- [#22064](https://github.com/LedgerHQ/ledger-live/pull/22064) [`d1d0d90`](https://github.com/LedgerHQ/ledger-live/commit/d1d0d90e75648ae1127b5682a6244b8e8268550a) Thanks [@semeano](https://github.com/semeano)! - Show a Zcash shielding transaction as private and display its shielded destination instead of its transparent change, masking that destination under discreet mode

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`29ce771`](https://github.com/LedgerHQ/ledger-live/commit/29ce7712ce93cd27afa97eda2d14a0ff066551fb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/ledger-wallet-framework@3.5.0-next.0
  - @ledgerhq/types-live@6.125.0-next.0
  - @ledgerhq/live-env@4.1.0-next.0
  - @ledgerhq/wallet-btc@0.6.0-next.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.8.0

### Minor Changes

- [#21962](https://github.com/LedgerHQ/ledger-live/pull/21962) [`f5d0da5`](https://github.com/LedgerHQ/ledger-live/commit/f5d0da5d43ff492175433453b08533cee324c6e2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Report both legs of a Zcash self-transfer in the account history

  A send from the private balance to the account's own transparent address — the send flow's "Self transfer" — appeared only as `Received`, never as `Sent`. One such transaction is recorded by both sync legs: the transparent leg credits the address it paid (`IN`), the shielded leg debits the pool it drained (`SHIELDED_TX_*_OUT`). `reconcileLegOperations` collapsed the two records by transaction hash alone, on the premise that a hash both legs see is one event seen twice, and kept the transparent one — dropping the send.

  Two records of one transaction are now collapsed only when they report the same direction, which is the case the rule exists for: a shield paying someone else, where the transparent leg debits the UTXOs and the shielded leg sees, through the outgoing viewing key, the note it created. Opposite directions are the two legs of a movement between the account's own pools and both are kept, the way a self-send is reported elsewhere. A superseded record's memo is still copied onto the transparent operation that replaces it; a record that survives keeps its own memo, so it is not printed on both rows.

  The same collapse hid the `Received` leg of the mirror flow, shielding to the account's own shielded address.

- [#22037](https://github.com/LedgerHQ/ledger-live/pull/22037) [`fecfcf7`](https://github.com/LedgerHQ/ledger-live/commit/fecfcf7570ed70213a9c0e32c2822b4eb057eb03) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix an incorrect fee on shielded and shielding sends when the leftover change was small enough to
  be folded into the fee instead of kept as a change note.

  The native Ironwood (V6) builder requires the fee to equal the exact ZIP-317 fee for the resulting
  spend/output layout; a fee larger than that by even a few zatoshis is rejected at build time. Coin
  selection no longer absorbs a small residual into the fee for any flow that builds through that
  builder ("shielded", "shielded-to-transparent", "transparent-to-shielded") -- the residual now
  always stays as change.

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`30828c2`](https://github.com/LedgerHQ/ledger-live/commit/30828c22cc44c9929d7eda782e9d559a9e0145c3), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0
  - @ledgerhq/wallet-btc@0.5.0
  - @ledgerhq/ledger-wallet-framework@3.4.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.8.0-next.0

### Minor Changes

- [#21962](https://github.com/LedgerHQ/ledger-live/pull/21962) [`f5d0da5`](https://github.com/LedgerHQ/ledger-live/commit/f5d0da5d43ff492175433453b08533cee324c6e2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Report both legs of a Zcash self-transfer in the account history

  A send from the private balance to the account's own transparent address — the send flow's "Self transfer" — appeared only as `Received`, never as `Sent`. One such transaction is recorded by both sync legs: the transparent leg credits the address it paid (`IN`), the shielded leg debits the pool it drained (`SHIELDED_TX_*_OUT`). `reconcileLegOperations` collapsed the two records by transaction hash alone, on the premise that a hash both legs see is one event seen twice, and kept the transparent one — dropping the send.

  Two records of one transaction are now collapsed only when they report the same direction, which is the case the rule exists for: a shield paying someone else, where the transparent leg debits the UTXOs and the shielded leg sees, through the outgoing viewing key, the note it created. Opposite directions are the two legs of a movement between the account's own pools and both are kept, the way a self-send is reported elsewhere. A superseded record's memo is still copied onto the transparent operation that replaces it; a record that survives keeps its own memo, so it is not printed on both rows.

  The same collapse hid the `Received` leg of the mirror flow, shielding to the account's own shielded address.

- [#22037](https://github.com/LedgerHQ/ledger-live/pull/22037) [`fecfcf7`](https://github.com/LedgerHQ/ledger-live/commit/fecfcf7570ed70213a9c0e32c2822b4eb057eb03) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix an incorrect fee on shielded and shielding sends when the leftover change was small enough to
  be folded into the fee instead of kept as a change note.

  The native Ironwood (V6) builder requires the fee to equal the exact ZIP-317 fee for the resulting
  spend/output layout; a fee larger than that by even a few zatoshis is rejected at build time. Coin
  selection no longer absorbs a small residual into the fee for any flow that builds through that
  builder ("shielded", "shielded-to-transparent", "transparent-to-shielded") -- the residual now
  always stays as change.

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`30828c2`](https://github.com/LedgerHQ/ledger-live/commit/30828c22cc44c9929d7eda782e9d559a9e0145c3), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0-next.0
  - @ledgerhq/wallet-btc@0.5.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.4.0-next.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.7.0

### Minor Changes

- [#21355](https://github.com/LedgerHQ/ledger-live/pull/21355) [`fc74af8`](https://github.com/LedgerHQ/ledger-live/commit/fc74af8db6038afd89c64de356e67fe9ba4811a0) Thanks [@semeano](https://github.com/semeano)! - Offer the Zcash memo only to shielded recipients. A memo travels in a shielded output, so a transparent recipient could never receive one, yet the send flow showed the input for every Zcash address and made the user fill or skip it. Send descriptors can now distinguish static memo support from recipient-specific visibility, and a memo left over from an earlier shielded recipient is dropped when the recipient turns transparent, so it can no longer reach the transaction builder.

- [#21355](https://github.com/LedgerHQ/ledger-live/pull/21355) [`5c23a76`](https://github.com/LedgerHQ/ledger-live/commit/5c23a7694a8304727c13d7383979d6a0660b1596) Thanks [@semeano](https://github.com/semeano)! - Reject a Zcash memo exceeding the ZIP-302 512-byte limit in getTransactionStatus

- [#21502](https://github.com/LedgerHQ/ledger-live/pull/21502) [`86fdaa1`](https://github.com/LedgerHQ/ledger-live/commit/86fdaa1929eeaf42d6d3765ce206758f0422c631) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Bound transparent-input and Ironwood-note selection to the device's per-PCZT ceilings on both pools, so a send from an account holding more UTXOs or notes than the device can sign in one PCZT no longer produces an unsignable transaction. A send whose full balance covers the requested amount but whose device-safe selection does not now reports a distinct, actionable error instead of a plain insufficient-balance one.

- [#21388](https://github.com/LedgerHQ/ledger-live/pull/21388) [`51a3d3e`](https://github.com/LedgerHQ/ledger-live/commit/51a3d3ef013a9310ed943a17a33ba69ea8d79a6d) Thanks [@pawell24](https://github.com/pawell24)! - Fix a transparent↔shielded transaction (shielding or de-shielding) being recorded twice in `account.operations` — once by the transparent leg's sync and once by the shielded leg's, for the same transaction hash. `reconcileLegOperations` now keeps only the transparent leg's record when both legs see the same hash.

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`0152cad`](https://github.com/LedgerHQ/ledger-live/commit/0152cade87e061bb2b56fd71f8a404c3dfed21e0), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783), [`6656f90`](https://github.com/LedgerHQ/ledger-live/commit/6656f90769c3419e1f121c0c2368eab4566e48ba)]:
  - @ledgerhq/types-live@6.123.0
  - @ledgerhq/ledger-wallet-framework@3.3.0
  - @ledgerhq/live-env@4.0.0
  - @ledgerhq/wallet-btc@0.4.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.7.0-next.0

### Minor Changes

- [#21355](https://github.com/LedgerHQ/ledger-live/pull/21355) [`fc74af8`](https://github.com/LedgerHQ/ledger-live/commit/fc74af8db6038afd89c64de356e67fe9ba4811a0) Thanks [@semeano](https://github.com/semeano)! - Offer the Zcash memo only to shielded recipients. A memo travels in a shielded output, so a transparent recipient could never receive one, yet the send flow showed the input for every Zcash address and made the user fill or skip it. Send descriptors can now distinguish static memo support from recipient-specific visibility, and a memo left over from an earlier shielded recipient is dropped when the recipient turns transparent, so it can no longer reach the transaction builder.

- [#21355](https://github.com/LedgerHQ/ledger-live/pull/21355) [`5c23a76`](https://github.com/LedgerHQ/ledger-live/commit/5c23a7694a8304727c13d7383979d6a0660b1596) Thanks [@semeano](https://github.com/semeano)! - Reject a Zcash memo exceeding the ZIP-302 512-byte limit in getTransactionStatus

- [#21502](https://github.com/LedgerHQ/ledger-live/pull/21502) [`86fdaa1`](https://github.com/LedgerHQ/ledger-live/commit/86fdaa1929eeaf42d6d3765ce206758f0422c631) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Bound transparent-input and Ironwood-note selection to the device's per-PCZT ceilings on both pools, so a send from an account holding more UTXOs or notes than the device can sign in one PCZT no longer produces an unsignable transaction. A send whose full balance covers the requested amount but whose device-safe selection does not now reports a distinct, actionable error instead of a plain insufficient-balance one.

- [#21388](https://github.com/LedgerHQ/ledger-live/pull/21388) [`51a3d3e`](https://github.com/LedgerHQ/ledger-live/commit/51a3d3ef013a9310ed943a17a33ba69ea8d79a6d) Thanks [@pawell24](https://github.com/pawell24)! - Fix a transparent↔shielded transaction (shielding or de-shielding) being recorded twice in `account.operations` — once by the transparent leg's sync and once by the shielded leg's, for the same transaction hash. `reconcileLegOperations` now keeps only the transparent leg's record when both legs see the same hash.

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`0152cad`](https://github.com/LedgerHQ/ledger-live/commit/0152cade87e061bb2b56fd71f8a404c3dfed21e0), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783), [`6656f90`](https://github.com/LedgerHQ/ledger-live/commit/6656f90769c3419e1f121c0c2368eab4566e48ba)]:
  - @ledgerhq/types-live@6.123.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.3.0-next.0
  - @ledgerhq/live-env@4.0.0-next.0
  - @ledgerhq/wallet-btc@0.4.0-next.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.6.0

### Minor Changes

- [#21045](https://github.com/LedgerHQ/ledger-live/pull/21045) [`4342943`](https://github.com/LedgerHQ/ledger-live/commit/43429435e5411592f61099f1d40712f055578b0c) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix missing memo in Zcash shielded operation details. After a shielded send with a memo, the memo is now persisted in the operation extra and displayed in Transaction details.

- [#21032](https://github.com/LedgerHQ/ledger-live/pull/21032) [`f9f6b71`](https://github.com/LedgerHQ/ledger-live/commit/f9f6b71d91c051b8e611a44f5b564cf5062cedb8) Thanks [@pawell24](https://github.com/pawell24)! - Default the Zcash shielded-balance birthday to Ironwood (NU6.3) mainnet activation
  instead of Orchard/NU5 activation, and reject a birthday dated in the future.

- [#21136](https://github.com/LedgerHQ/ledger-live/pull/21136) [`bf22729`](https://github.com/LedgerHQ/ledger-live/commit/bf22729942b9dc114644dd3dc32962c08012c1cc) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Fix flaky note-reservation boundary test by using fake timers

- [#21179](https://github.com/LedgerHQ/ledger-live/pull/21179) [`46ed356`](https://github.com/LedgerHQ/ledger-live/commit/46ed356e325028c4e8e461b72f7dce631c7362e3) Thanks [@pawell24](https://github.com/pawell24)! - Fix the Zcash shielded-balance "Stop sync" action, which previously did nothing when the
  running sync was started automatically by the standard wallet sync rather than by the
  manual start button, and could resume on its own shortly after a manual stop otherwise
  succeeded.

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0
  - @ledgerhq/ledger-wallet-framework@3.2.0
  - @ledgerhq/live-env@3.2.0
  - @ledgerhq/wallet-btc@0.3.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.6.0-next.0

### Minor Changes

- [#21045](https://github.com/LedgerHQ/ledger-live/pull/21045) [`4342943`](https://github.com/LedgerHQ/ledger-live/commit/43429435e5411592f61099f1d40712f055578b0c) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix missing memo in Zcash shielded operation details. After a shielded send with a memo, the memo is now persisted in the operation extra and displayed in Transaction details.

- [#21032](https://github.com/LedgerHQ/ledger-live/pull/21032) [`f9f6b71`](https://github.com/LedgerHQ/ledger-live/commit/f9f6b71d91c051b8e611a44f5b564cf5062cedb8) Thanks [@pawell24](https://github.com/pawell24)! - Default the Zcash shielded-balance birthday to Ironwood (NU6.3) mainnet activation
  instead of Orchard/NU5 activation, and reject a birthday dated in the future.

- [#21136](https://github.com/LedgerHQ/ledger-live/pull/21136) [`bf22729`](https://github.com/LedgerHQ/ledger-live/commit/bf22729942b9dc114644dd3dc32962c08012c1cc) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Fix flaky note-reservation boundary test by using fake timers

- [#21179](https://github.com/LedgerHQ/ledger-live/pull/21179) [`46ed356`](https://github.com/LedgerHQ/ledger-live/commit/46ed356e325028c4e8e461b72f7dce631c7362e3) Thanks [@pawell24](https://github.com/pawell24)! - Fix the Zcash shielded-balance "Stop sync" action, which previously did nothing when the
  running sync was started automatically by the standard wallet sync rather than by the
  manual start button, and could resume on its own shortly after a manual stop otherwise
  succeeded.

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.2.0-next.0
  - @ledgerhq/live-env@3.2.0-next.0
  - @ledgerhq/wallet-btc@0.3.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.5.0

### Minor Changes

- [#20995](https://github.com/LedgerHQ/ledger-live/pull/20995) [`8ebdb6a`](https://github.com/LedgerHQ/ledger-live/commit/8ebdb6aff25864883e189ebc3206a9901f5798a4) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Send transparent funds without the account's UFVK. Every Zcash send required one, so a public t→t send failed at the device step with "Missing UFVK — account not yet synced" on any account that had not run the viewing-key export flow — which is a device confirmation, and which the send flow deliberately does not ask for (only the private transfer option is gated on it). Transparent funds were therefore unspendable until the user activated their private balance.

  This needs `@ledgerhq/zcash-utils` 2.2.0, which the catalog now pins: earlier versions require the viewing key for every build, whatever the flow.

  The shielded pools stay out of reach in exchange: a unified address carrying an Orchard receiver is now refused as a recipient when the account has no UFVK, reported on the address field instead of accepted and failed at the device step. A malformed or Sapling address keeps its own error, so the user is not sent to the export flow over a typo.

  A transparent send carries no shielded bundle and reads no shielded key material: the only key it needs is the account-level transparent pubkey, which is the payload of the account xpub the account already holds. It is now read from there (`accountPubkeyFromXpub`, the counterpart of the existing `composeXpub`) and passed to the builder in place of the UFVK, whose absence no longer blocks the flow. An account that does have a UFVK keeps using it, so its code path is unchanged. Flows that spend or create shielded value still require the UFVK and now report it as a typed `ZcashShieldedKeyMissing` rather than a bare error.

- [#21034](https://github.com/LedgerHQ/ledger-live/pull/21034) [`17a4154`](https://github.com/LedgerHQ/ledger-live/commit/17a415450136066be114ede1f7e591fa4ec3ee5f) Thanks [@cted-ledger](https://github.com/cted-ledger)! - [ZEC] Reject a transparent-output amount below the network's dust threshold at the Amount step instead of signing and failing at broadcast.

- [#20949](https://github.com/LedgerHQ/ledger-live/pull/20949) [`a56baa8`](https://github.com/LedgerHQ/ledger-live/commit/a56baa8d0b71460066bc8173767920049aa50e37) Thanks [@pawell24](https://github.com/pawell24)! - Fold a Zcash account's shielded balance sync into the standard automatic wallet sync instead of requiring a manual trigger, and make that trigger unconditional and spam-proof. The account page's shielded balance now refreshes on launch and on the regular sync interval, the Amount step of a send refreshes it when moving on from the Recipient step, and a completed private transfer triggers a follow-up sync so the account page converges without a manual refresh. The manual "sync balance" action is now offered and enabled in every state, including once a scan has completed, and clicking it while a sync is already running no longer cancels and restarts it.

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0
  - @ledgerhq/ledger-wallet-framework@3.1.0
  - @ledgerhq/live-env@3.1.0
  - @ledgerhq/live-signer-zcash@0.10.0
  - @ledgerhq/wallet-btc@0.3.0

## 0.5.0-next.0

### Minor Changes

- [#20995](https://github.com/LedgerHQ/ledger-live/pull/20995) [`8ebdb6a`](https://github.com/LedgerHQ/ledger-live/commit/8ebdb6aff25864883e189ebc3206a9901f5798a4) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Send transparent funds without the account's UFVK. Every Zcash send required one, so a public t→t send failed at the device step with "Missing UFVK — account not yet synced" on any account that had not run the viewing-key export flow — which is a device confirmation, and which the send flow deliberately does not ask for (only the private transfer option is gated on it). Transparent funds were therefore unspendable until the user activated their private balance.

  This needs `@ledgerhq/zcash-utils` 2.2.0, which the catalog now pins: earlier versions require the viewing key for every build, whatever the flow.

  The shielded pools stay out of reach in exchange: a unified address carrying an Orchard receiver is now refused as a recipient when the account has no UFVK, reported on the address field instead of accepted and failed at the device step. A malformed or Sapling address keeps its own error, so the user is not sent to the export flow over a typo.

  A transparent send carries no shielded bundle and reads no shielded key material: the only key it needs is the account-level transparent pubkey, which is the payload of the account xpub the account already holds. It is now read from there (`accountPubkeyFromXpub`, the counterpart of the existing `composeXpub`) and passed to the builder in place of the UFVK, whose absence no longer blocks the flow. An account that does have a UFVK keeps using it, so its code path is unchanged. Flows that spend or create shielded value still require the UFVK and now report it as a typed `ZcashShieldedKeyMissing` rather than a bare error.

- [#21034](https://github.com/LedgerHQ/ledger-live/pull/21034) [`17a4154`](https://github.com/LedgerHQ/ledger-live/commit/17a415450136066be114ede1f7e591fa4ec3ee5f) Thanks [@cted-ledger](https://github.com/cted-ledger)! - [ZEC] Reject a transparent-output amount below the network's dust threshold at the Amount step instead of signing and failing at broadcast.

- [#20949](https://github.com/LedgerHQ/ledger-live/pull/20949) [`a56baa8`](https://github.com/LedgerHQ/ledger-live/commit/a56baa8d0b71460066bc8173767920049aa50e37) Thanks [@pawell24](https://github.com/pawell24)! - Fold a Zcash account's shielded balance sync into the standard automatic wallet sync instead of requiring a manual trigger, and make that trigger unconditional and spam-proof. The account page's shielded balance now refreshes on launch and on the regular sync interval, the Amount step of a send refreshes it when moving on from the Recipient step, and a completed private transfer triggers a follow-up sync so the account page converges without a manual refresh. The manual "sync balance" action is now offered and enabled in every state, including once a scan has completed, and clicking it while a sync is already running no longer cancels and restarts it.

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.1.0-next.0
  - @ledgerhq/live-env@3.1.0-next.0
  - @ledgerhq/live-signer-zcash@0.10.0
  - @ledgerhq/wallet-btc@0.3.0

## 0.4.0

### Minor Changes

- [#20815](https://github.com/LedgerHQ/ledger-live/pull/20815) [`54fcd49`](https://github.com/LedgerHQ/ledger-live/commit/54fcd49f48deaed0aec71941c8b9926e6b6aee2e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Exclude immature Ironwood notes from the spendable pool. A shielded note is only spendable once its transaction is buried deep enough to have a witness at the builder's anchor, so a freshly scanned change note is no longer selected while a second send is prepared within the same confirmation window. The rule is applied wherever the spendable pool is derived — note selection, max-spendable and amount validation — and the send flow now reports insufficient spendable funds instead of failing when the transaction is built. Funds held by maturing notes stay part of the account's total balance.

- [#20658](https://github.com/LedgerHQ/ledger-live/pull/20658) [`a79b9aa`](https://github.com/LedgerHQ/ledger-live/commit/a79b9aacb2f21c89bd192342bc6b98a4265d4345) Thanks [@semeano](https://github.com/semeano)! - Zcash: add self transfer option on send modal

- [#20798](https://github.com/LedgerHQ/ledger-live/pull/20798) [`1de6156`](https://github.com/LedgerHQ/ledger-live/commit/1de61569d59e56b73a8797397cbdd1a10b069b08) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Name the Ironwood shielded operations and stop listing Zcash self-transfers.

  The Ironwood operation types were declared and given icons but never labelled, so a received or sent Ironwood transaction rendered its raw key in the history. They now carry the same labels, address cells and "Private (Ironwood)" transaction-type detail as the Sapling and Orchard ones.

  A shielded transaction that moved no value across the wallet boundary — every note landing on the account's own internal address — was also emitted as a history row of its own: no counterparty, a value of 0, and, when it was the shielded leg of a transparent-funded sweep, a duplicate of the transparent operation already listing that transaction. Such a transaction now produces an operation typed `NONE`, which keeps it in the account data while leaving it out of the lists. Its classification is unchanged, so the fee and balance logic that reads it is unaffected.

- [#20707](https://github.com/LedgerHQ/ledger-live/pull/20707) [`4cc31ec`](https://github.com/LedgerHQ/ledger-live/commit/4cc31ec90cae0a36663b35da3a569222e8e8efdf) Thanks [@semeano](https://github.com/semeano)! - Carry the Ironwood bundle through to the device signer.

- [#20756](https://github.com/LedgerHQ/ledger-live/pull/20756) [`02ddf7e`](https://github.com/LedgerHQ/ledger-live/commit/02ddf7e9d7542d6f0fcdb18d7f9461c37a8b8ce1) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Forward Ironwood spend-auth signatures to PCZT finalization (LIVE-35956).

  `signOperation` now passes the device's Ironwood `spendAuthSig` values to `combine`, so a V6 PCZT (any shielded or shielding send) finalizes through the same `finalizeTransaction` entry point as a V5 one — `@ledgerhq/zcash-utils` (bumped to 2.1.1) injects both pools' signatures and extracts the signed transaction. `ironwoodSignatures` is omitted rather than sent empty when the device signed no Ironwood action, because zcash-utils length-checks each pool's list against the PCZT.

- [#20714](https://github.com/LedgerHQ/ledger-live/pull/20714) [`93406e8`](https://github.com/LedgerHQ/ledger-live/commit/93406e87ae4398e314f899a0b30e54653b73c18b) Thanks [@semeano](https://github.com/semeano)! - Show a warning in the send flow when the Zcash private balance is selected as source and funds were shielded in the last 15 minutes, explaining that recently shielded funds need confirmations and scanning before they are spendable

### Patch Changes

- Updated dependencies [[`8a93a70`](https://github.com/LedgerHQ/ledger-live/commit/8a93a701d631bd18b6c5125f77588802c0325b4c), [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/live-signer-zcash@0.10.0
  - @ledgerhq/types-live@6.120.0
  - @ledgerhq/ledger-wallet-framework@3.0.0
  - @ledgerhq/wallet-btc@0.3.0

## 0.4.0-next.1

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @ledgerhq/types-live@6.120.0-next.1
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.1
  - @ledgerhq/live-signer-zcash@0.10.0-next.0
  - @ledgerhq/wallet-btc@0.3.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
